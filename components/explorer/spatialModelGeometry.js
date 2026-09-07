import { BoxGeometry, EdgesGeometry, PlaneGeometry } from "three";
import { spatialLayouts } from "../../data/models/spatial-models";

// Two small shared shapes, independent of the number of marker occurrences.
// CellBatch owns and disposes its merged copies; these remain module-owned.
const shapes = {
  telluric: new BoxGeometry(1.05, 0.82, 0.07),
  stowe: new BoxGeometry(1.03, 1.03, 0.07),
};
const outlines = Object.fromEntries(
  Object.entries(shapes).map(([id, geometry]) => [
    id,
    new EdgesGeometry(geometry),
  ]),
);
const picking = {
  telluric: new PlaneGeometry(1.05, 0.82).translate(0, 0, 0.035),
  stowe: new PlaneGeometry(1.03, 1.03).translate(0, 0, 0.035),
};
const cache = {};

export function createSpatialModelCells(id) {
  if (!spatialLayouts[id]) return [];
  cache[id] ||= spatialLayouts[id].map((slot) => ({
    ...slot,
    geometry: shapes[id],
    pickingGeometry: picking[id],
    outline: outlines[id],
    labelWidth: slot.width - 0.08,
    labelHeight: slot.height - 0.08,
    labelPosition: [0, 0, 0.043],
  }));
  return cache[id];
}
