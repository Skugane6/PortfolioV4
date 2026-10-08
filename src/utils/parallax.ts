export interface Vec2 {
  x: number;
  y: number;
}

export function computeParallaxOffset(pointer: Vec2, factor = 0.6): Vec2 {
  const clampedX = Math.max(-1, Math.min(1, pointer.x));
  const clampedY = Math.max(-1, Math.min(1, pointer.y));
  return { x: clampedX * factor, y: clampedY * factor };
}
