import { CanvasTexture, SRGBColorSpace } from "three";
import elements from "../../public/elements.json";

let atlases;
const labelFamily = '"neue-haas-grotesk-display", sans-serif';

function paintAtlas(texture, level) {
  const context = texture.image.getContext("2d");
  context.clearRect(0, 0, 2048, 1024);
  context.fillStyle = "white";
  context.textBaseline = "middle";
  const draw = (text, x, y, size, maximum = 114, bold = false) => {
    context.font = `${bold ? "700" : "500"} ${size}px ${labelFamily}`;
    const width = context.measureText(text).width;
    if (width > maximum) {
      size *= maximum / width;
      context.font = `${bold ? "700" : "500"} ${size}px ${labelFamily}`;
    }
    context.fillText(text, x, y);
  };
  elements.forEach((element, index) => {
    const x = (index % 16) * 128;
    const y = Math.floor(index / 16) * 128;
    context.textAlign = "center";
    draw(
      element.symbol,
      x + 64,
      y + (level < 2 ? 70 : 60),
      level === 0 ? 75 : level === 1 ? 62 : 48,
      112,
      true,
    );
    if (level >= 1) {
      context.textAlign = "left";
      draw(String(element.number), x + 9, y + 16, 18);
      context.textAlign = "center";
    }
    if (level >= 2) draw(element.name, x + 64, y + 97, 15);
    if (level >= 3) draw(String(element.atomic_mass), x + 64, y + 116, 12);
  });
  texture.needsUpdate = true;
}

// Four shared textures. Draw the fallback immediately, then repaint the same
// resources when the site's existing web font is ready; never block the scene.
export function getLabelAtlases() {
  if (atlases) return atlases;
  atlases = Array.from({ length: 4 }, (_, level) => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    paintAtlas(texture, level);
    return texture;
  });
  if (document.fonts) {
    Promise.allSettled([
      document.fonts.load(`700 75px ${labelFamily}`),
      document.fonts.load(`500 18px ${labelFamily}`),
    ]).then(() => atlases.forEach(paintAtlas));
  }
  return atlases;
}
