const towerImageModules = import.meta.glob("./entities/towers/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Readonly<Record<string, string>>;

export function towerImageUrl(towerId: string): string {
  const image = towerImageModules[`./entities/towers/${towerId}.png`];
  if (image === undefined) {
    throw new Error(`Tower '${towerId}' has no bundled image.`);
  }
  return image;
}
