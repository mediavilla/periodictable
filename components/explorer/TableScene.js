import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import anime from "animejs";
import elements from "../../public/elements.json";
import giguereLayout from "../../data/giguere-layout.json";
import { tableById } from "../../data/table-registry";
import { useExplorer } from "./ExplorerProvider";
import ElementCell, { facePlane } from "./ElementCell";
import { createRacetrackCells } from "./racetrackGeometry";
import BohrModel from "./BohrModel";
import GiguereStructure from "./GiguereStructure";
import CellBatch from "./CellBatch";
import SceneLights from "./SceneLights";
import { loadAdditionalCells, normalizeCells } from "./modelGeometry";
import { slotNumbers } from "../../data/model-slots.mjs";
import { cylinderExitDistance, clearPanelRadius } from "./cameraLimits.mjs";
const faceOutline = new THREE.EdgesGeometry(facePlane);
const SpatialModelStructure = lazy(() => import("./SpatialModelStructure"));
const PlanarModelStructure = lazy(() => import("./PlanarModelStructure"));
const minimumDistance = (model, target, direction) => {
  if (!model.camera.orbit) return model.camera.minDistance || 2;
  const collision = model.camera.collision;
  if (collision?.type === "cylinder")
    return Math.max(
      2,
      cylinderExitDistance(
        target.toArray(),
        direction.toArray(),
        collision.radius + collision.padding,
        collision.halfHeight + collision.padding,
      ),
    );
  if (collision?.type === "panels") return model.camera.minDistance || 2;
  return (model.camera.minDistance || 12) + target.length();
};

export function layoutCells(id) {
  if (id === "racetrack") return createRacetrackCells();
  if (id === "giguere")
    return giguereLayout.map((c) => ({
      ...c,
      position: [c.position[0] - 2.1, c.position[1], c.position[2] - 2.1],
      geometry: facePlane,
      outline: faceOutline,
      labelPosition: [0, 0, 0.009],
    }));
  if (id !== "18") return [];
  return elements.map((e) => ({
    number: e.number,
    position: [e.col18Xpos - 9.5, 5.5 - e.col18Ypos, 0],
  }));
}
function distanceFor(design, aspect) {
  return (
    Math.max(design.camera.height, design.camera.width / aspect) /
      (2 * Math.tan((38 * Math.PI) / 360)) +
    design.camera.depth * 0.35
  );
}
export default function TableScene({ viewRef, visible = true }) {
  const {
    design,
    active,
    activeSlot,
    selected,
    hoverSlot,
    selectSlot,
    openSlot,
    setWebglFailed,
    openElement,
    panel,
    reducedMotion,
    command,
  } = useExplorer();
  const [displayed, setDisplayed] = useState(design.id);
  const [cells, setCells] = useState(() =>
    normalizeCells(design.id, layoutCells(design.id)),
  );
  const cameraRef = useRef();
  const controls = useRef();
  const group = useRef();
  const backdrop = useRef();
  const transition = useRef({ amount: 0 });
  const cameraMotion = useRef({
    progress: 1,
    active: false,
    goal: null,
    fromTarget: new THREE.Vector3(),
    fromOrbit: new THREE.Spherical(),
    orbit: new THREE.Spherical(),
    offset: new THREE.Vector3(),
  });
  const initialized = useRef(false);
  const pending = useRef(design.id);
  const saved = useRef(null);
  const priorPanel = useRef(false);
  const hasShownTable = useRef(!panel);
  const priorCommand = useRef(command.serial);
  const touchSelection = useRef(null);
  const actual = tableById(displayed);
  const { size } = useThree();
  const debugTime = useRef(0);
  const fading = useRef(false);
  const latest = useRef({ design, panel, reducedMotion, visible });
  latest.current = { design, panel, reducedMotion, visible };
  const framePose = (id) => {
    const d = tableById(id);
    const rect = viewRef.current?.getBoundingClientRect();
    const dist = distanceFor(
      d,
      (rect?.width || size.width) / (rect?.height || size.height),
    );
    return {
      target: new THREE.Vector3(),
      position: new THREE.Vector3(
        ...(d.camera.direction ||
          (d.camera.orbit ? [0.58, 0.18, 0.82] : [0, 0, 1])),
      )
        .normalize()
        .multiplyScalar(dist),
    };
  };
  const syncControls = () => {
    const camera = cameraRef.current;
    const control = controls.current;
    if (!camera || !control) return;
    const position = camera.position.clone();
    const target = control.target.clone();
    const damping = control.enableDamping;
    // Consume any residual drag/pan momentum before handing the camera back.
    // Restore the exact pose afterwards: update() can clamp old/new limits.
    control.enableDamping = false;
    control.update();
    control.target.copy(target);
    camera.position.copy(position);
    control.update();
    control.target.copy(target);
    camera.position.copy(position);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    control.enableDamping = damping;
  };
  const applyCameraMotion = (progress) => {
    const camera = cameraRef.current;
    const control = controls.current;
    const motion = cameraMotion.current;
    if (!camera || !control || !motion.goal) return;
    // Framing follows a View's changing CSS rectangle while the panel opens.
    // Restoration instead uses its fixed snapshot, independent of that rect.
    const destination = motion.goal.design
      ? framePose(motion.goal.design)
      : motion.goal;
    if (progress >= 1) {
      camera.position.copy(destination.position);
      control.target.copy(destination.target);
    } else {
      motion.offset.copy(destination.position).sub(destination.target);
      motion.orbit.setFromVector3(motion.offset);
      const theta = motion.orbit.theta - motion.fromOrbit.theta;
      motion.orbit.theta =
        motion.fromOrbit.theta +
        Math.atan2(Math.sin(theta), Math.cos(theta)) * progress;
      motion.orbit.phi = THREE.MathUtils.lerp(
        motion.fromOrbit.phi,
        motion.orbit.phi,
        progress,
      );
      motion.orbit.radius = THREE.MathUtils.lerp(
        motion.fromOrbit.radius,
        motion.orbit.radius,
        progress,
      );
      control.target.lerpVectors(
        motion.fromTarget,
        destination.target,
        progress,
      );
      camera.position
        .copy(control.target)
        .add(motion.offset.setFromSpherical(motion.orbit));
    }
    camera.lookAt(control.target);
    camera.updateMatrixWorld();
  };
  const moveCamera = (goal, duration = 600) => {
    const camera = cameraRef.current;
    const control = controls.current;
    if (!camera || !control) return;
    const motion = cameraMotion.current;
    anime.remove(motion);
    control.enabled = false;
    syncControls();
    motion.goal = goal;
    motion.fromTarget.copy(control.target);
    motion.fromOrbit.setFromVector3(
      motion.offset.copy(camera.position).sub(control.target),
    );
    motion.progress = 0;
    motion.active = true;
    const finish = () => {
      applyCameraMotion(1);
      syncControls();
      motion.progress = 1;
      motion.active = false;
    };
    if (!duration || latest.current.reducedMotion) {
      finish();
      return;
    }
    anime({
      targets: motion,
      progress: 1,
      duration,
      easing: "easeOutCubic",
      complete: finish,
    });
  };
  const fit = (id = latest.current.design.id, duration = 600) => {
    moveCamera({ design: id }, duration);
  };
  useEffect(() => {
    fit(design.id, 0); /* Initial framing has no journey to animate. */
    const motion = cameraMotion.current;
    return () => anime.remove(motion);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    pending.current = design.id;
    anime.remove(transition.current);
    const motion = transition.current;
    let cancelled = false;
    const prepare = async () => {
      const raw = ["18", "racetrack", "giguere"].includes(design.id)
        ? layoutCells(design.id)
        : await loadAdditionalCells(design.id);
      if (cancelled) return;
      const nextCells = normalizeCells(design.id, raw);
      if (!initialized.current) {
        initialized.current = true;
        setCells(nextCells);
        setDisplayed(design.id);
        fit(design.id, 0);
        return;
      }
      saved.current = null;
      // The latest request owns both camera and table motion. Wait for its
      // geometry before sending the currently visible model out of the scene.
      fit(design.id, 870);
      anime({
        targets: motion,
        amount: 1,
        duration: latest.current.reducedMotion ? 90 : 320,
        easing: "easeInQuad",
        complete: () => {
          if (cancelled) return;
          setDisplayed(design.id);
          setCells(nextCells);
          motion.amount = -1;
          anime({
            targets: motion,
            amount: 0,
            duration: latest.current.reducedMotion ? 100 : 550,
            easing: "easeOutCubic",
          });
        },
      });
    };
    prepare().catch((error) => {
      if (!cancelled) {
        console.error("Unable to prepare table geometry", error);
        setWebglFailed(true);
      }
    });
    return () => {
      cancelled = true;
      anime.remove(motion);
    };
  }, [design.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    touchSelection.current = null;
  }, [displayed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cameraRef.current || !controls.current) return;
    if (panel && !priorPanel.current) {
      saved.current = hasShownTable.current
        ? {
            design: design.id,
            position: cameraRef.current.position.clone(),
            target: controls.current.target.clone(),
          }
        : null;
      fit();
    }
    if (!panel && priorPanel.current) {
      const snapshot = saved.current;
      if (snapshot?.design === design.id) {
        moveCamera({
          position: snapshot.position.clone(),
          target: snapshot.target.clone(),
        });
      } else fit();
      hasShownTable.current = true;
    }
    priorPanel.current = !!panel;
  }, [panel, design.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const resize = () => {
      // A viewport change must never replace a saved-camera return journey.
      if (cameraMotion.current.active && !cameraMotion.current.goal?.design)
        return;
      fit(latest.current.design.id, 400);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!reducedMotion || !cameraMotion.current.active) return;
    anime.remove(cameraMotion.current);
    applyCameraMotion(1);
    syncControls();
    cameraMotion.current.active = false;
    cameraMotion.current.progress = 1;
  }, [reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      priorCommand.current === command.serial ||
      !cameraRef.current ||
      !controls.current
    )
      return;
    priorCommand.current = command.serial;
    if (command.type === "reset") {
      fit();
      return;
    }
    if (Math.abs(transition.current.amount) > 0.02) return;
    const target = controls.current.target.clone();
    if (
      !actual.camera.orbit ||
      (actual.camera.focusSelection && command.type === "in")
    ) {
      const found = cells.find((c) =>
        activeSlot
          ? c.id === activeSlot.id
          : slotNumbers(c).includes(selected.number),
      );
      if (found) {
        target.x = found.position[0];
        target.y = found.position[1];
        if (actual.camera.orbit) target.z = found.position[2];
      }
    }
    if (actual.camera.orbit) {
      const { panX = 4, panY = 3, panZ = 4 } = actual.camera;
      target.clamp(
        new THREE.Vector3(-panX, -panY, -panZ),
        new THREE.Vector3(panX, panY, panZ),
      );
    }
    const offset = cameraRef.current.position.clone().sub(target);
    const factor = command.type === "in" ? 0.72 : 1.38;
    offset.multiplyScalar(factor);
    const orbit = new THREE.Spherical().setFromVector3(offset);
    orbit.radius = THREE.MathUtils.clamp(
      orbit.radius,
      minimumDistance(actual, target, offset.clone().normalize()),
      framePose(actual.id).position.length(),
    );
    orbit.phi = THREE.MathUtils.clamp(
      orbit.phi,
      actual.camera.orbit ? 0.3 : Math.PI / 2,
      actual.camera.orbit ? Math.PI - 0.3 : Math.PI / 2,
    );
    if (!actual.camera.orbit) {
      orbit.theta = 0;
    }
    if (
      command.type === "out" &&
      orbit.radius >= framePose(actual.id).position.length() - 0.001
    ) {
      fit();
      return;
    }
    // End inside the same limits OrbitControls will apply when it resumes,
    // including a panned 3D target's larger collision-safe minimum distance.
    offset.setFromSpherical(orbit);
    moveCamera({ position: target.clone().add(offset), target }, 320);
  }, [command]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(({ camera, clock, gl }) => {
    const moving = cameraMotion.current.active;
    if (moving) applyCameraMotion(cameraMotion.current.progress);
    if (controls.current) {
      controls.current.enabled =
        displayed === design.id &&
        visible &&
        !moving &&
        Math.abs(transition.current.amount) < 0.002;
    }
    if (group.current) {
      const t = transition.current.amount;
      group.current.position.x = reducedMotion ? 0 : t * 28;
      group.current.position.z = reducedMotion ? 0 : -Math.abs(t) * 8;
      group.current.scale.setScalar(reducedMotion ? 1 : 1 - Math.abs(t) * 0.1);
      group.current.visible = Math.abs(t) < 0.995;
      if (reducedMotion || fading.current) {
        group.current.traverse((object) => {
          const material = object.material;
          if (!material || material.visible === false) return;
          material.userData.fadeDefaults ??= {
            opacity: material.opacity,
            transparent: material.transparent,
          };
          const initial = material.userData.fadeDefaults;
          material.opacity =
            initial.opacity * (reducedMotion ? 1 - Math.abs(t) : 1);
          const transparent =
            initial.transparent || material.opacity < initial.opacity;
          if (transparent !== material.transparent) {
            material.transparent = transparent;
            material.needsUpdate = true;
          }
        });
        fading.current = reducedMotion && Math.abs(t) > 0.001;
      }
    }
    if (
      controls.current &&
      actual.camera.orbit &&
      (!moving ||
        (displayed === design.id &&
          Math.abs(transition.current.amount) < 0.002))
    ) {
      const t = controls.current.target;
      const { panX = 4, panY = 3, panZ = 4 } = actual.camera;
      const previousTarget = t.clone();
      t.clamp(
        new THREE.Vector3(-panX, -panY, -panZ),
        new THREE.Vector3(panX, panY, panZ),
      );
      cameraRef.current.position.add(t.clone().sub(previousTarget));
      const offset = cameraRef.current.position.clone().sub(t);
      const radius = offset.length();
      const direction = offset.normalize();
      controls.current.minDistance = minimumDistance(actual, t, direction);
      const clearRadius =
        actual.camera.collision?.type === "panels"
          ? clearPanelRadius(
              t.toArray(),
              direction.toArray(),
              Math.max(radius, controls.current.minDistance),
              cells,
            )
          : Math.max(radius, controls.current.minDistance);
      if (clearRadius > radius)
        cameraRef.current.position
          .copy(t)
          .addScaledVector(direction, clearRadius);
    }
    if (controls.current && !moving) {
      controls.current.maxDistance = Math.max(
        controls.current.minDistance,
        framePose(actual.id).position.length(),
      );
      if (!actual.camera.orbit) {
        const target = controls.current.target;
        const x = THREE.MathUtils.clamp(
          target.x,
          -actual.camera.width / 2,
          actual.camera.width / 2,
        );
        const y = THREE.MathUtils.clamp(
          target.y,
          -actual.camera.height / 2,
          actual.camera.height / 2,
        );
        cameraRef.current.position.x += x - target.x;
        cameraRef.current.position.y += y - target.y;
        target.set(x, y, 0);
      }
    }
    if (backdrop.current) {
      backdrop.current.position.copy(camera.position);
      backdrop.current.quaternion.copy(camera.quaternion);
      backdrop.current.translateZ(-80);
    }
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      clock.elapsedTime - debugTime.current > 0.15
    ) {
      debugTime.current = clock.elapsedTime;
      const rect = viewRef.current?.getBoundingClientRect();
      const projectedCells = rect
        ? cells.map((cell) => {
            const position = new THREE.Vector3(...cell.position).applyMatrix4(
              group.current.matrixWorld,
            );
            const normal = new THREE.Vector3(0, 0, 1)
              .applyEuler(new THREE.Euler(...(cell.rotation || [0, 0, 0])))
              .applyQuaternion(group.current.quaternion);
            const frontFacing =
              normal.dot(camera.position.clone().sub(position)) > 0;
            position.project(camera);
            return {
              number: cell.number,
              id: cell.id,
              kind: cell.kind || "element",
              x: rect.left + ((position.x + 1) * rect.width) / 2,
              y: rect.top + ((1 - position.y) * rect.height) / 2,
              frontFacing,
            };
          })
        : [];
      window.__periodicScene = {
        design: displayed,
        count: cells.length,
        camera: camera.position.toArray(),
        target: controls.current?.target.toArray(),
        transition: transition.current.amount,
        cameraMoving: cameraMotion.current.active,
        commandSerial: command.serial,
        panel,
        activeSlot: activeSlot?.id || null,
        limits: {
          min: controls.current?.minDistance,
          max: controls.current?.maxDistance,
        },
        projectedCells,
        cells: projectedCells,
        coordinateSpace: "viewport",
        resources: { ...gl.info.memory },
        drawCalls: gl.info.render.calls,
      };
    }
  });
  const choose = (cell, pointerType) => {
    if (displayed !== design.id || Math.abs(transition.current.amount) > 0.02)
      return;
    if (
      !panel &&
      pointerType === "touch" &&
      touchSelection.current !== cell.id
    ) {
      touchSelection.current = cell.id;
      selectSlot(cell);
    } else {
      touchSelection.current = null;
      if (cell.note || cell.historical || !cell.number) openSlot(cell);
      else openElement(elements[cell.number - 1]);
    }
  };
  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={38}
        position={[0, 0, 32]}
        near={0.1}
        far={300}
      />
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={visible}
        enableDamping
        dampingFactor={0.12}
        enablePan
        enableRotate={actual.camera.orbit}
        screenSpacePanning
        mouseButtons={{
          LEFT: actual.camera.orbit ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        zoomToCursor={!actual.camera.orbit}
        minDistance={
          actual.camera.minDistance || (actual.camera.orbit ? 12 : 2)
        }
        maxDistance={framePose(actual.id).position.length()}
        minAzimuthAngle={actual.camera.orbit ? -Infinity : 0}
        maxAzimuthAngle={actual.camera.orbit ? Infinity : 0}
        minPolarAngle={actual.camera.orbit ? 0.3 : Math.PI / 2}
        maxPolarAngle={actual.camera.orbit ? Math.PI - 0.3 : Math.PI / 2}
        touches={{
          ONE: actual.camera.orbit ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 15]} intensity={1.2} />
      <SceneLights
        active={active}
        activeSlot={activeSlot}
        cells={cells}
        anchors={actual.lightingAnchors}
        visible={visible}
      />
      <group ref={backdrop}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[400, 300]} />
          <meshStandardMaterial color="#fafafa" roughness={1} />
        </mesh>
        <SceneLights
          active={active}
          activeSlot={activeSlot}
          cells={cells}
          anchors={[
            [-20, 4, 14],
            [25, 9, 17],
            [0, -15, 12],
          ]}
          backdrop
          visible={visible}
        />
        <group
          position={[-36, -32, 0.2]}
          scale={15}
          visible={!activeSlot || !!activeSlot.number}
        >
          <BohrModel
            element={active}
            color="#555555"
            decorative
            paused={
              reducedMotion || !visible || !!(activeSlot && !activeSlot.number)
            }
          />
        </group>
      </group>
      <group ref={group}>
        {actual.renderer === "giguere" && <GiguereStructure />}
        <Suspense fallback={null}>
          {actual.renderer === "spatial" && (
            <SpatialModelStructure design={displayed} />
          )}
          {actual.renderer === "planar" && (
            <PlanarModelStructure design={displayed} />
          )}
        </Suspense>
        <CellBatch
          cells={cells}
          activeNumber={active.number}
          activeSlotId={activeSlot?.id}
          disabled={false}
          visible={visible}
        />
        {cells.map((cell) => (
          <ElementCell
            batched
            key={`${displayed}-${cell.id}`}
            cell={cell}
            active={active.number === cell.number}
            onHover={hoverSlot}
            onSelect={choose}
            disabled={displayed !== design.id}
          />
        ))}
      </group>
    </>
  );
}
