import { MODEL_LAYOUTS, tableById } from "../../data/table-registry";

// Geometry is created only for the requested layout. The lightweight registry
// and historical slot records remain usable without loading a WebGL renderer.
export async function loadAdditionalCells(id) {
  if (tableById(id).renderer === "planar") {
    const geometryModule = await import("./planarModelGeometry");
    return geometryModule.createPlanarModelCells(id);
  }
  if (tableById(id).renderer === "spatial") {
    const geometryModule = await import("./spatialModelGeometry");
    return geometryModule.createSpatialModelCells(id);
  }
  return MODEL_LAYOUTS[id] || [];
}

export function normalizeCells(id, cells) {
  return cells.map((cell, index) => ({
    ...cell,
    id: cell.id || `${id}-${cell.number ?? index}`,
    scale:
      cell.scale ||
      (!cell.geometry ? [cell.width || 1, cell.height || 1, 1] : undefined),
    labelWidth: cell.labelWidth || (cell.width ? cell.width * 0.91 : undefined),
    labelHeight:
      cell.labelHeight || (cell.height ? cell.height * 0.91 : undefined),
  }));
}
