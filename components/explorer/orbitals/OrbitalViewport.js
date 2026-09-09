import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { View } from "@react-three/drei";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Minus,
  Plus,
  RotateCcw,
  Hand,
} from "lucide-react";
import { useExplorer } from "../ExplorerProvider";
import { getOrbitalPreset } from "../../../data/orbital-presets.mjs";
import OrbitalVolume from "./OrbitalVolume";
import styles from "./OrbitalViewport.module.css";

class OrbitalBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const cameraDefaults = { yaw: 0.85, pitch: 0.32, zoom: 1 };

export default function OrbitalViewport({ element }) {
  const preset = getOrbitalPreset(element.number);
  const { webglFailed, registerViewport } = useExplorer();
  const id = useId(),
    descriptionId = useId();
  const surface = useRef(),
    axes = useRef();
  const [orbital, setOrbital] = useState(preset.defaultOrbital);
  const [axis, setAxis] = useState(preset.defaultOrientation);
  const [cutaway, setCutaway] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [touchAvailable, setTouchAvailable] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const pointers = useRef(new Map());
  const controller = useRef({
    ...cameraDefaults,
    orbital,
    axis,
    cutaway: false,
    width: 0,
    height: 0,
    visible: false,
    coarse: false,
    interacting: false,
    invalidate: () => {},
  });
  const subshell = preset.subshells.find((item) => item.id === orbital);
  const onFailure = useCallback(() => setFailed(true), []);
  const update = useCallback((values) => {
    Object.assign(controller.current, values);
    controller.current.invalidate();
  }, []);
  useEffect(() => {
    registerViewport(id, visible && !failed && !webglFailed);
    return () => registerViewport(id, false);
  }, [id, visible, failed, webglFailed, registerViewport]);
  useEffect(() => {
    const holder = surface.current;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      update({ visible: entry.isIntersecting });
    });
    const resize = new ResizeObserver(([entry]) =>
      update({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(holder);
    resize.observe(holder);
    const media = window.matchMedia("(pointer: coarse)");
    const touchMedia = window.matchMedia("(any-pointer: coarse)");
    const input = () => {
      setCoarse(media.matches);
      setTouchAvailable(touchMedia.matches);
      update({ coarse: media.matches });
    };
    input();
    media.addEventListener("change", input);
    touchMedia.addEventListener("change", input);
    return () => {
      observer.disconnect();
      resize.disconnect();
      media.removeEventListener("change", input);
      touchMedia.removeEventListener("change", input);
    };
  }, [update]);
  useEffect(() => {
    const holder = surface.current;
    const wheel = (event) => {
      // Leave ordinary page scrolling available until the user engages the view.
      if (document.activeElement !== holder) return;
      event.preventDefault();
      event.stopPropagation();
      update({
        zoom: clamp(
          controller.current.zoom * Math.exp(-event.deltaY * 0.002),
          1,
          8,
        ),
      });
    };
    holder.addEventListener("wheel", wheel, { passive: false });
    return () => holder.removeEventListener("wheel", wheel);
  }, [update]);

  const reset = () => update(cameraDefaults);
  const rotate = (yaw, pitch) =>
    update({
      yaw: controller.current.yaw + yaw,
      pitch: clamp(controller.current.pitch + pitch, -1.4, 1.4),
    });
  const zoom = (factor) =>
    update({ zoom: clamp(controller.current.zoom * factor, 1, 8) });
  const selectOrbital = (value) => {
    setOrbital(value);
    setCutaway(false);
    setAxis("z");
    update({ ...cameraDefaults, orbital: value, axis: "z", cutaway: false });
  };
  const down = (event) => {
    if (event.button !== 0 || (event.pointerType === "touch" && !touchActive))
      return;
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    update({ interacting: true });
  };
  const move = (event) => {
    const points = pointers.current,
      previous = points.get(event.pointerId);
    if (!previous) return;
    event.stopPropagation();
    const other = [...points.entries()].find(
      ([key]) => key !== event.pointerId,
    )?.[1];
    if (other) {
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(
        event.clientX - other.x,
        event.clientY - other.y,
      );
      if (before > 1) zoom(after / before);
    } else
      rotate(
        -(event.clientX - previous.x) * 0.008,
        (event.clientY - previous.y) * 0.008,
      );
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const up = (event) => {
    pointers.current.delete(event.pointerId);
    update({ interacting: pointers.current.size > 0 });
  };
  const keydown = (event) => {
    const actions = {
      ArrowLeft: () => rotate(-0.15, 0),
      ArrowRight: () => rotate(0.15, 0),
      ArrowUp: () => rotate(0, 0.15),
      ArrowDown: () => rotate(0, -0.15),
      "+": () => zoom(1.2),
      "=": () => zoom(1.2),
      "-": () => zoom(1 / 1.2),
      Home: reset,
      Escape: () => {
        setTouchActive(false);
        surface.current.blur();
      },
    };
    if (actions[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      actions[event.key]();
    }
  };
  const unavailable = webglFailed || failed;
  return (
    <div className={styles.orbitals} data-testid="orbital-visualization">
      <div className={styles.selectors}>
        <label>
          Subshell
          <select
            aria-label="Orbital subshell"
            value={orbital}
            onChange={(event) => selectOrbital(event.target.value)}
          >
            {preset.subshells.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id}
              </option>
            ))}
          </select>
        </label>
        {orbital === "2p" && (
          <label>
            Orientation
            <select
              aria-label="Orbital orientation"
              value={axis}
              onChange={(event) => {
                setAxis(event.target.value);
                update({ axis: event.target.value });
              }}
            >
              {["x", "y", "z"].map((value) => (
                <option key={value} value={value}>
                  2p · {value}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className={styles.population}>
          {subshell.electrons}{" "}
          {subshell.electrons === 1 ? "electron" : "electrons"} in {orbital}{" "}
          subshell
        </span>
      </div>
      <div className={styles.plot}>
        <View
          ref={surface}
          visible={visible && !unavailable}
          className={styles.surface}
          data-testid="orbital-surface"
          data-touch-active={touchActive}
          tabIndex={unavailable ? -1 : 0}
          role="group"
          aria-label={`${element.name} ${orbital} orbital, interactive 3D view`}
          aria-describedby={descriptionId}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onLostPointerCapture={up}
          onKeyDown={keydown}
        >
          {!unavailable && (
            <OrbitalBoundary onFailure={onFailure}>
              <OrbitalVolume
                controller={controller}
                surface={surface}
                axes={axes}
                onFailure={onFailure}
              />
            </OrbitalBoundary>
          )}
        </View>
        {unavailable ? (
          <div className={styles.fallback} role="status">
            The 3D orbital view is unavailable. {subshell.description} You can
            still explore the shell model and element properties.
          </div>
        ) : (
          <>
            <span className={styles.plotLabel}>
              {orbital}
              {orbital === "2p" ? ` · ${axis}` : ""}
              <small>
                {cutaway ? "Front half removed" : "Probability cloud"}
              </small>
            </span>
            <svg
              ref={axes}
              className={styles.axes}
              viewBox="0 0 84 84"
              role="img"
              aria-label="Orbital x, y and z axes"
            >
              {["x", "y", "z"].map((value) => (
                <g key={value} data-axis={value}>
                  <line x1="42" y1="42" x2="42" y2="42" />
                  <text x="42" y="42" textAnchor="middle">
                    {value}
                  </text>
                </g>
              ))}
              <circle cx="42" cy="42" r="2" />
            </svg>
          </>
        )}
      </div>
      <div className={styles.legend} aria-label="Wavefunction sign legend">
        <span>
          <i className={styles.positive} />
          Positive sign
        </span>
        <span>
          <i className={styles.negative} />
          Negative sign
        </span>
      </div>
      {!unavailable && (
        <>
          {touchAvailable && (
            <button
              type="button"
              className={styles.touchButton}
              onClick={() => {
                setTouchActive(!touchActive);
                pointers.current.clear();
                update({ interacting: false });
              }}
            >
              <Hand aria-hidden="true" />
              {touchActive ? "Done interacting" : "Interact with orbital"}
            </button>
          )}
          <div
            className={styles.controls}
            role="group"
            aria-label="Orbital camera controls"
          >
            <button
              type="button"
              aria-label="Zoom out orbital"
              onClick={() => zoom(1 / 1.2)}
            >
              <Minus aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Zoom in orbital"
              onClick={() => zoom(1.2)}
            >
              <Plus aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Reset orbital view"
              onClick={reset}
            >
              <RotateCcw aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Rotate orbital left"
              onClick={() => rotate(-0.2, 0)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Rotate orbital right"
              onClick={() => rotate(0.2, 0)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Rotate orbital up"
              onClick={() => rotate(0, 0.2)}
            >
              <ArrowUp aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Rotate orbital down"
              onClick={() => rotate(0, -0.2)}
            >
              <ArrowDown aria-hidden="true" />
            </button>
          </div>
          <label className={styles.cutaway}>
            <input
              type="checkbox"
              checked={cutaway}
              onChange={(event) => {
                setCutaway(event.target.checked);
                update({ cutaway: event.target.checked });
              }}
            />
            Show cross-section
          </label>
        </>
      )}
      <p id={descriptionId} className={styles.description}>
        {subshell.description}
      </p>
      {!unavailable && (
        <p className={styles.hint}>
          {touchActive
            ? "Drag to rotate · pinch to zoom · Done returns to scrolling"
            : coarse
              ? "Scroll freely, or activate the view to rotate and pinch."
              : "Drag to rotate · focus the view to scroll to zoom. Arrow keys rotate; + / − zoom; Home resets."}
        </p>
      )}
    </div>
  );
}
