import assert from "node:assert/strict";
import test from "node:test";
import {
  cylinderExitDistance,
  clearPanelRadius,
} from "../components/explorer/cameraLimits.mjs";

test("cylindrical camera clearance works at side, pole and panned targets", () => {
  for (const target of [
    [0, 0, 0],
    [1, 14, 1],
    [-1, -14, 0],
  ]) {
    for (const phi of [0.3, 0.8, Math.PI / 2, Math.PI - 0.3]) {
      const direction = [Math.sin(phi), Math.cos(phi), 0];
      const distance = cylinderExitDistance(target, direction, 5.7, 15.7);
      const position = target.map(
        (value, axis) => value + direction[axis] * distance,
      );
      assert.ok(
        Math.hypot(position[0], position[2]) >= 5.7 - 1e-9 ||
          Math.abs(position[1]) >= 15.7 - 1e-9,
        "Camera must leave the padded cylinder",
      );
    }
  }
  assert.equal(
    cylinderExitDistance([0, 12, 0], [0, 0, 1], 5.7, 15.7),
    5.7,
    "Axial pan does not add an arbitrary distance penalty",
  );
});

test("sparse spatial layers allow close inspection while keeping the camera out of panels", () => {
  const panels = [
    { position: [0, 3, 0], width: 1, height: 1 },
    { position: [0, 6, 0], width: 1, height: 1 },
  ];
  assert.equal(clearPanelRadius([0, 0, 0], [0, 1, 0], 2, panels), 2);
  assert.ok(clearPanelRadius([0, 0, 0], [0, 1, 0], 3, panels) > 3.35);
  assert.ok(clearPanelRadius([0, 0, 0], [0, 1, 0], 6, panels) > 6.35);
  assert.equal(
    clearPanelRadius([2, 0, 0], [0, 1, 0], 3, panels),
    3,
    "Space beside a layer stays free",
  );
});
