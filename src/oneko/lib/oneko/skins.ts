import sheets from "./skin-sheets.json";

export type OnekoSkin = keyof typeof sheets;

/** Bundled pixel art, trimmed from the upstream 24 sheets to the ones this site ships. */
export const ONEKO_SKINS = [
  { id: "classic", name: "Classic", description: "The little cat that started it all" },
  { id: "calico", name: "Calico", description: "A patchwork of mischief" },
  { id: "tora", name: "Tora", description: "A little tiger at heart" },
  { id: "ghost", name: "Ghost", description: "A pleasantly spooky companion" },
  { id: "blue-frost", name: "Blue Frost", description: "Snowy paws and an icy blue coat" },
  { id: "tuxedo", name: "Tuxedo", description: "Dressed up in a white bib and socks" },
] as const satisfies ReadonlyArray<{ id: OnekoSkin; name: string; description: string }>;

export function isOnekoSkin(value: unknown): value is OnekoSkin {
  return typeof value === "string" && Object.hasOwn(sheets, value);
}

export function getSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}
