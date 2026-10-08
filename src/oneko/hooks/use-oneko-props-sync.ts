import { useEffect } from "react";
import { useSpriteAppearance } from "./use-sprite-appearance";
import { applyRuntimeConfig, type CatRuntimeConfig } from "../lib/oneko/runtime-config";
import { getSkinSource, type OnekoSkin } from "../lib/oneko/skins";
import type { CatRuntimeState } from "../lib/oneko/types";

type SyncableProps = CatRuntimeConfig & { hueRotate: number; skin: OnekoSkin; spriteSrc?: string };

export function useOnekoPropsSync(
  stateRef: { current: CatRuntimeState },
  elRef: { current: HTMLDivElement | null },
  props: SyncableProps,
) {
  useSpriteAppearance(elRef, props.spriteSrc || getSkinSource(props.skin), props.hueRotate);

  // Reapply after a render, including when the animation DOM is remounted.
  useEffect(() => {
    const state = stateRef.current;
    applyRuntimeConfig(state, props);
    const el = elRef.current;
    if (!el) return;
    el.style.transform = `scale(${props.scale}) rotate(${state.currentRotation}deg)`;
    el.style.opacity = String(props.opacity);
    // Roam mode is driven by nudging the cat, so it has to be clickable. Every
    // other mode leaves it inert so it never eats a click meant for the page.
    el.style.pointerEvents = props.roam ? "auto" : "none";
    el.style.cursor = props.roam ? "pointer" : "";
  });
}
