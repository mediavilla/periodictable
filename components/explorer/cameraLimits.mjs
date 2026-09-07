// Camera constraints use the model's physical shape, not its overall height.
// Arrays keep the arithmetic testable without a renderer or a browser.
export function cylinderExitDistance(target, direction, radius, halfHeight) {
  const [x, y, z] = target;
  const [dx, dy, dz] = direction;
  const a = dx * dx + dz * dz;
  const b = 2 * (x * dx + z * dz);
  const c = x * x + z * z - radius * radius;
  const radial =
    a > 1e-9
      ? (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a)
      : Infinity;
  const axial =
    Math.abs(dy) > 1e-9
      ? ((dy > 0 ? halfHeight : -halfHeight) - y) / dy
      : Infinity;
  return Math.max(0, Math.min(radial, axial));
}

export function clearPanelRadius(
  target,
  direction,
  radius,
  panels,
  padding = 0.32,
) {
  // Each Stowe site is a thin horizontal panel. If the camera lands in an
  // expanded panel box, move it out along its current viewing ray. Empty space
  // between layers remains navigable and doesn't need a bounding-sphere limit.
  let result = radius;
  for (let pass = 0; pass < panels.length; pass += 1) {
    let changed = false;
    for (const panel of panels) {
      const half = [
        (panel.width || 1.03) / 2 + padding,
        0.035 + padding,
        (panel.height || 1.03) / 2 + padding,
      ];
      let enter = -Infinity;
      let leave = Infinity;
      for (let axis = 0; axis < 3; axis += 1) {
        const lower = panel.position[axis] - half[axis] - target[axis];
        const upper = panel.position[axis] + half[axis] - target[axis];
        if (Math.abs(direction[axis]) < 1e-9) {
          if (lower > 0 || upper < 0) {
            leave = -Infinity;
            break;
          }
        } else {
          const a = lower / direction[axis];
          const b = upper / direction[axis];
          enter = Math.max(enter, Math.min(a, b));
          leave = Math.min(leave, Math.max(a, b));
        }
      }
      if (result >= enter && result <= leave) {
        result = leave + 0.001;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return result;
}
