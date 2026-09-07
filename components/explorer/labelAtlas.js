import { CanvasTexture, SRGBColorSpace } from "three";

let atlases;
let activeLabels;
let activeRows;
const labelFamily = '"Geist", sans-serif';
export const labelAtlasRows = (count) => Math.max(8, Math.ceil(count / 16));

function paintAtlas(texture, level, labels) {
  const context = texture.image.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, texture.image.width, texture.image.height);
  const scale = level >= 3 ? 2 : 1;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.fillStyle = "white";
  context.textBaseline = "middle";
  const draw = (
    text,
    x,
    y,
    size,
    maximum = 114,
    bold = false,
    mono = false,
  ) => {
    context.font = `${bold ? "500" : "400"} ${size}px ${mono ? '"Geist Mono", monospace' : labelFamily}`;
    const width = context.measureText(text).width;
    if (width > maximum) {
      size *= maximum / width;
      context.font = `${bold ? "500" : "400"} ${size}px ${mono ? '"Geist Mono", monospace' : labelFamily}`;
    }
    context.fillText(text, x, y);
  };
  labels.forEach((element, index) => {
    const x = (index % 16) * 128;
    const y = Math.floor(index / 16) * 128;
    context.textAlign = "center";
    draw(
      element.symbol,
      x + 64,
      y + (level < 2 ? 70 : level === 4 ? 47 : 60),
      level === 0 ? 75 : level === 1 ? 62 : level === 4 ? 39 : 48,
      112,
      true,
    );
    if (level >= 1) {
      context.textAlign = element.style === "racetrack" ? "center" : "left";
      draw(
        String(element.number),
        x + (element.style === "racetrack" ? 64 : 9),
        y + 16,
        18,
        114,
        false,
        true,
      );
      context.textAlign = "center";
    }
    if (level >= 2)
      draw(
        element.name,
        x + 64,
        y + (level === 4 ? 76 : 97),
        level === 4 ? 13 : 15,
      );
    if (level >= 3)
      draw(
        element.mass,
        x + 64,
        y + (level === 4 ? 94 : 116),
        12,
        114,
        false,
        true,
      );
    if (level === 4)
      draw(element.configuration, x + 64, y + 113, 11, 114, false, true);
  });
  texture.needsUpdate = true;
}

// Five shared textures for the active layout. Repaint them when label alignment
// changes instead of retaining another atlas set per design. Font loading also
// repaints the current style, so a late font never restores an outgoing layout.
export function getLabelAtlases(labels) {
  const rows = labelAtlasRows(labels.length);
  if (atlases && rows !== activeRows) {
    atlases.forEach((texture) => texture.dispose());
    atlases = null;
  }
  activeRows = rows;
  if (atlases) {
    if (labels !== activeLabels) {
      activeLabels = labels;
      atlases.forEach((texture, level) => paintAtlas(texture, level, labels));
    }
    return atlases;
  }
  activeLabels = labels;
  atlases = Array.from({ length: 5 }, (_, level) => {
    const canvas = document.createElement("canvas");
    canvas.width = level >= 3 ? 4096 : 2048;
    canvas.height = rows * (level >= 3 ? 256 : 128);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    paintAtlas(texture, level, labels);
    return texture;
  });
  if (document.fonts) {
    Promise.allSettled([
      document.fonts.load(`500 75px ${labelFamily}`),
      document.fonts.load('400 18px "Geist Mono"'),
    ]).then(() =>
      atlases.forEach((texture, level) =>
        paintAtlas(texture, level, activeLabels),
      ),
    );
  }
  return atlases;
}
