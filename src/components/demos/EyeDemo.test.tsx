import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import EyeDemo from './EyeDemo';
import { SimulatedGaze } from './SimulatedGaze';
import { MODEL_URL, WASM_BASE_URL } from './gaze';

// MediaPipe is mocked: the factory records when the module is first imported,
// so the tests can prove nothing loads before the visitor opts in, and that
// the camera is asked for before any download.
const mp = vi.hoisted(() => ({
  imported: vi.fn(),
  order: [] as string[],
  forVisionTasks: vi.fn(),
  createFromOptions: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => {
  mp.imported();
  mp.order.push('import');
  return {
    FilesetResolver: { forVisionTasks: mp.forVisionTasks },
    FaceLandmarker: { createFromOptions: mp.createFromOptions },
  };
});

const DENIED = "Camera permission was denied, so here's a simulation of the same pipeline.";
const NO_CAMERA = "No camera was found, so here's a simulation of the same pipeline.";
const SIM_LABEL = 'Simulation: no camera in use';

function fakeStream() {
  const track = { stop: vi.fn() };
  return { stream: { getTracks: () => [track] } as unknown as MediaStream, track };
}

function fakeLandmarker() {
  return { close: vi.fn(), detectForVideo: vi.fn() };
}

function setMediaDevices(value: unknown) {
  Object.defineProperty(navigator, 'mediaDevices', { value, configurable: true, writable: true });
}

let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mp.forVisionTasks.mockReset().mockResolvedValue({ wasmLoaderPath: 'x.js', wasmBinaryPath: 'x.wasm' });
  mp.createFromOptions.mockReset();
  getUserMedia = vi.fn();
  setMediaDevices({ getUserMedia });
  // jsdom has no media playback.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  setMediaDevices(undefined);
  vi.restoreAllMocks();
});

const startButton = () => screen.getByRole('button', { name: 'Start the camera demo' });

describe('EyeDemo', () => {
  // Keep this test first: the mocked module is imported (and recorded) only once per file.
  it('loads nothing until the visitor starts, then asks for the camera before downloading anything', async () => {
    const { stream, track } = fakeStream();
    const landmarker = fakeLandmarker();
    getUserMedia.mockImplementation(async () => {
      mp.order.push('getUserMedia');
      return stream;
    });
    mp.createFromOptions.mockResolvedValue(landmarker);

    const { unmount } = render(<EyeDemo />);
    expect(startButton()).toBeInTheDocument();
    expect(screen.getByText(/Runs Google's MediaPipe Face Landmarker in your browser\. The video never leaves your device\./)).toBeInTheDocument();
    expect(mp.imported).not.toHaveBeenCalled();
    expect(getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(startButton());
    expect(await screen.findByText(/Point 1 of 5: look at the dot in the centre/)).toBeInTheDocument();

    expect(mp.order).toEqual(['getUserMedia', 'import']);
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'user', width: 640, height: 480 } });
    expect(mp.forVisionTasks).toHaveBeenCalledWith(WASM_BASE_URL);
    expect(mp.createFromOptions).toHaveBeenCalledTimes(1);
    expect(mp.createFromOptions.mock.calls[0][1]).toEqual({
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      numFaces: 1,
    });
    expect(screen.getByText('Camera preview, not recorded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Next/ })).toBeInTheDocument();

    // Closing the case study unmounts the demo: camera light off, model freed.
    unmount();
    expect(track.stop).toHaveBeenCalled();
    expect(landmarker.close).toHaveBeenCalled();
  });

  it('shows the denial message and the simulation when permission is denied, without downloading', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    render(<EyeDemo />);
    fireEvent.click(startButton());

    expect(await screen.findByText(DENIED)).toBeInTheDocument();
    expect(screen.getByText(SIM_LABEL)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(mp.forVisionTasks).not.toHaveBeenCalled();
    expect(mp.createFromOptions).not.toHaveBeenCalled();
  });

  it('shows the simulation without touching the camera when the visitor asks for it', () => {
    render(<EyeDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Watch a simulation instead' }));

    expect(screen.getByText(SIM_LABEL)).toBeInTheDocument();
    expect(screen.getByText('Webcam → iris landmarks → smoothed gaze → cursor + click')).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(mp.forVisionTasks).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Back to the camera demo' }));
    expect(startButton()).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('says no camera was found for NotFoundError, OverconstrainedError, or no mediaDevices at all', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('none', 'NotFoundError'));
    const { unmount } = render(<EyeDemo />);
    fireEvent.click(startButton());
    expect(await screen.findByText(NO_CAMERA)).toBeInTheDocument();
    expect(screen.getByText(SIM_LABEL)).toBeInTheDocument();

    getUserMedia.mockRejectedValueOnce(Object.assign(new Error('bad constraint'), { name: 'OverconstrainedError' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(NO_CAMERA)).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    unmount();

    setMediaDevices(undefined);
    render(<EyeDemo />);
    fireEvent.click(startButton());
    expect(await screen.findByText(NO_CAMERA)).toBeInTheDocument();
  });

  it('falls back to the CPU delegate when the GPU one fails', async () => {
    const { stream } = fakeStream();
    getUserMedia.mockResolvedValue(stream);
    mp.createFromOptions.mockRejectedValueOnce(new Error('WebGL2 unavailable')).mockResolvedValueOnce(fakeLandmarker());
    render(<EyeDemo />);
    fireEvent.click(startButton());

    expect(await screen.findByText(/Point 1 of 5/)).toBeInTheDocument();
    expect(mp.createFromOptions.mock.calls.map((c) => c[1].baseOptions.delegate)).toEqual(['GPU', 'CPU']);
  });

  it('turns the camera off and explains when the model cannot load', async () => {
    const { stream, track } = fakeStream();
    getUserMedia.mockResolvedValue(stream);
    mp.createFromOptions.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<EyeDemo />);
    fireEvent.click(startButton());

    expect(
      await screen.findByText("The face model couldn't load (a network error), so here's a simulation of the same pipeline."),
    ).toBeInTheDocument();
    expect(screen.getByText(SIM_LABEL)).toBeInTheDocument();
    expect(track.stop).toHaveBeenCalled();
  });

  it('stops the camera and closes the model on Stop camera', async () => {
    const { stream, track } = fakeStream();
    const landmarker = fakeLandmarker();
    getUserMedia.mockResolvedValue(stream);
    mp.createFromOptions.mockResolvedValue(landmarker);
    render(<EyeDemo />);
    fireEvent.click(startButton());
    await screen.findByText(/Point 1 of 5/);

    fireEvent.click(screen.getByRole('button', { name: 'Stop camera' }));
    expect(track.stop).toHaveBeenCalled();
    expect(landmarker.close).toHaveBeenCalled();
    expect(screen.getByText('Camera stopped.')).toBeInTheDocument();
    expect(startButton()).toHaveFocus();
  });

  it('never leaves the camera on if the demo closes while permission is pending', async () => {
    const { stream, track } = fakeStream();
    let grant: (s: MediaStream) => void = () => {};
    getUserMedia.mockImplementation(() => new Promise<MediaStream>((resolve) => (grant = resolve)));
    const { unmount } = render(<EyeDemo />);
    fireEvent.click(startButton());
    expect(screen.getByText('Asking for camera permission…')).toBeInTheDocument();

    unmount();
    await act(async () => grant(stream));
    expect(track.stop).toHaveBeenCalled();
    expect(mp.forVisionTasks).not.toHaveBeenCalled();
  });
});

describe('SimulatedGaze', () => {
  afterEach(() => {
    delete document.documentElement.dataset.motion;
    vi.unstubAllGlobals();
  });

  it('is a still drawing with a Step button under reduced motion', () => {
    document.documentElement.dataset.motion = 'reduce';
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<SimulatedGaze />);

    expect(screen.getByText(SIM_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /simulation/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Reticle on A1. Step to blink and select it.');

    fireEvent.click(screen.getByRole('button', { name: 'Step' }));
    expect(screen.getByRole('status')).toHaveTextContent('Blink selected A1. Reticle now on A3.');
    expect(screen.getByText(/1 of 9 selected/)).toBeInTheDocument();
    expect(raf).not.toHaveBeenCalled();
  });

  it('runs its animation loop only while on screen, and can be paused', () => {
    let report: (visible: boolean) => void = () => {};
    class ControlledObserver {
      constructor(cb: IntersectionObserverCallback) {
        report = (visible) =>
          act(() => cb([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<SimulatedGaze />);
    expect(raf).not.toHaveBeenCalled();

    report(true);
    expect(raf).toHaveBeenCalledTimes(1);

    report(false);
    expect(cancel).toHaveBeenCalled();

    report(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pause simulation' }));
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step' })).toBeInTheDocument();
  });
});
