export function assetPath(source, basePath = "") {
  return source?.startsWith("/") && !source.startsWith("//")
    ? `${basePath}${source}`
    : source;
}
