import { EMPTY_ZONES } from "./zone-runtime";
import type { OnekoZone } from "./zones";
import type { CatRuntimeState, OnekoProps } from "./types";

type RuntimeConfigStateFields = Pick<
  CatRuntimeState,
  | "pausedCfg"
  | "followCursorCfg"
  | "roamCfg"
  | "roamDwellRange"
  | "roamMinHopCfg"
  | "roamMaxHopCfg"
  | "roamAreaCfg"
  | "roamNudgeOnlyCfg"
  | "roamTarget"
  | "roamDwell"
  | "roamWake"
  | "roamPivots"
  | "roamPivotsSignature"
  | "roamHidden"
  | "roamStuckTicks"
  | "roamLastX"
  | "roamLastY"
  | "sleepEnabledCfg"
  | "bubblePlacementCfg"
  | "bubbleScaleCfg"
  | "soundBasePathCfg"
  | "currentSpeed"
  | "scale"
  | "opacity"
  | "rotationAmount"
  | "idleThresholdMs"
  | "freerunChanceCfg"
  | "freerunDurationCfg"
  | "bubbleEnabledCfg"
  | "bubbleDisplayFramesCfg"
  | "bubbleCooldownFramesCfg"
  | "bubbleChanceCfg"
  | "followDistanceCfg"
  | "animationSpeedCfg"
  | "customBubbleText"
  | "currentRotation"
  | "enableMeow"
  | "soundVolumeCfg"
  | "soundCooldown"
  | "bubbleTimer"
  | "bubbleCooldown"
  | "bubbleVisible"
  | "lastBubbleMsg"
  | "laserPointerCfg"
  | "laserCaught"
>;

export function defaultRuntimeConfigState(): RuntimeConfigStateFields {
  return {
    pausedCfg: false,
    followCursorCfg: true,
    roamCfg: false,
    roamDwellRange: [180, 480],
    roamMinHopCfg: 0.3,
    roamMaxHopCfg: 1,
    roamAreaCfg: null,
    roamNudgeOnlyCfg: false,
    roamTarget: null,
    roamDwell: 0,
    roamWake: false,
    roamPivots: [],
    roamPivotsSignature: "",
    roamHidden: false,
    roamStuckTicks: 0,
    roamLastX: 0,
    roamLastY: 0,
    sleepEnabledCfg: true,
    bubblePlacementCfg: "auto",
    bubbleScaleCfg: 1,
    soundBasePathCfg: "/cat-sounds",
    currentSpeed: 0,
    scale: 1,
    opacity: 1,
    rotationAmount: 0,
    idleThresholdMs: 0,
    freerunChanceCfg: 0,
    freerunDurationCfg: 0,
    bubbleEnabledCfg: true,
    bubbleDisplayFramesCfg: 0,
    bubbleCooldownFramesCfg: 0,
    bubbleChanceCfg: 0,
    followDistanceCfg: 0,
    animationSpeedCfg: 1,
    customBubbleText: "",
    currentRotation: 0,
    enableMeow: true,
    soundVolumeCfg: 0,
    soundCooldown: 0,
    bubbleTimer: 0,
    bubbleCooldown: 0,
    bubbleVisible: false,
    lastBubbleMsg: -1,
    laserPointerCfg: false,
    laserCaught: false,
  };
}

export type CatRuntimeConfig = Pick<
  OnekoProps,
  | "paused"
  | "followCursor"
  | "sleepEnabled"
  | "bubblePlacement"
  | "bubbleScale"
  | "soundBasePath"
  | "roam"
  | "roamArea"
  | "roamNudgeOnly"
  | "roamDwellFrames"
  | "roamMinHop"
  | "roamMaxHop"
> & {
  zones?: readonly OnekoZone[];
  zoneAttractionChance?: number;
  zoneAttractionDuration?: number;
  speed: number;
  scale: number;
  opacity: number;
  rotationAmount: number;
  idleThreshold: number;
  freerunChance: number;
  freerunDuration: number;
  bubbleEnabled: boolean;
  bubbleDisplayFrames: number;
  bubbleCooldown: number;
  bubbleChance: number;
  followDistance: number;
  animationSpeed: number;
  bubbleText: NonNullable<OnekoProps["bubbleText"]>;
  meow: boolean;
  volume: number;
  laserPointer: boolean;
};

export function applyRuntimeConfig(state: CatRuntimeState, config: CatRuntimeConfig): void {
  state.pausedCfg = config.paused ?? false;
  state.followCursorCfg = config.followCursor ?? true;
  const roaming = config.roam ?? false;
  if (roaming !== state.roamCfg) {
    // Switching modes invalidates any spot the cat was walking to.
    state.roamTarget = null;
    state.roamDwell = 0;
  }
  state.roamCfg = roaming;
  const dwell = config.roamDwellFrames;
  state.roamDwellRange =
    dwell && Number.isFinite(dwell[0]) && Number.isFinite(dwell[1]) && dwell[1] >= dwell[0]
      ? [Math.max(0, dwell[0]), Math.max(0, dwell[1])]
      : [180, 480];
  state.roamMinHopCfg = Number.isFinite(config.roamMinHop)
    ? Math.max(0, Math.min(1, config.roamMinHop!))
    : 0.3;
  state.roamMaxHopCfg = Number.isFinite(config.roamMaxHop)
    ? Math.max(state.roamMinHopCfg, Math.min(1, config.roamMaxHop!))
    : 1;
  if (config.roamArea !== state.roamAreaCfg) {
    // A different area invalidates the perches computed for the old one.
    state.roamPivots = [];
    state.roamPivotsSignature = "";
  }
  state.roamAreaCfg = config.roamArea ?? null;
  state.roamNudgeOnlyCfg = config.roamNudgeOnly ?? false;
  state.sleepEnabledCfg = config.sleepEnabled ?? true;
  state.bubblePlacementCfg =
    config.bubblePlacement === "above" || config.bubblePlacement === "below"
      ? config.bubblePlacement
      : "auto";
  state.bubbleScaleCfg = Number.isFinite(config.bubbleScale)
    ? Math.max(0.5, Math.min(2, config.bubbleScale!))
    : 1;
  state.soundBasePathCfg = (config.soundBasePath ?? "/cat-sounds").replace(/\/+$/, "");
  if (!state.followCursorCfg && !state.roamCfg) {
    state.freerunMode = false;
    state.freerunTimer = 0;
    state.currentPath = [];
    state.pathWaypointIdx = 0;
    state.nekoVelX = 0;
    state.nekoVelY = 0;
  }
  state.zoneState.definitions = config.zones ?? EMPTY_ZONES;
  state.zoneState.chance = Number.isFinite(config.zoneAttractionChance)
    ? Math.max(0, Math.min(1, config.zoneAttractionChance!))
    : 0.3;
  state.zoneState.duration = Number.isFinite(config.zoneAttractionDuration)
    ? Math.max(1, Math.min(600, Math.round(config.zoneAttractionDuration! / 100)))
    : 40;
  state.currentSpeed = config.speed;
  state.scale = config.scale;
  state.opacity = config.opacity;
  state.rotationAmount = config.rotationAmount;
  state.idleThresholdMs = config.idleThreshold;
  state.freerunChanceCfg = config.freerunChance;
  state.freerunDurationCfg = config.freerunDuration;
  state.bubbleEnabledCfg = config.bubbleEnabled;
  state.bubbleDisplayFramesCfg = config.bubbleDisplayFrames;
  state.bubbleCooldownFramesCfg = config.bubbleCooldown;
  state.bubbleChanceCfg = config.bubbleChance;
  state.followDistanceCfg = config.followDistance;
  state.animationSpeedCfg = config.animationSpeed;
  state.customBubbleText = config.bubbleText;
  state.enableMeow = config.meow;
  state.soundVolumeCfg = config.volume;
  state.laserPointerCfg = config.laserPointer;
  if (!config.laserPointer) {
    state.laserCaught = false;
  }
}
