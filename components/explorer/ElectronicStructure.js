import { Component, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import BohrViewport from "./BohrViewport";
import styles from "./ElementDetail.module.css";

function OrbitalLoading({ error, retry }) {
  return (
    <div className={styles.structureFallback} role="status">
      <p>
        {error
          ? "The orbital view could not load. You can still explore the shell model and electron configuration."
          : "Preparing the orbital view…"}
      </p>
      {error && retry && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

const OrbitalViewport = dynamic(() => import("./orbitals/OrbitalViewport"), {
  ssr: false,
  loading: OrbitalLoading,
});

class OrbitalBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <div className={styles.structureFallback} role="status">
        <p>
          The orbital view is unavailable. Its model description and electron
          configuration remain below; you can also return to the shell model.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}

const MODES = [
  { id: "shell", label: "Shell model" },
  { id: "orbitals", label: "Orbitals" },
];

export default function ElectronicStructure({ block, element }) {
  const [mode, setMode] = useState("shell");
  const id = useId();
  const tabs = useRef({});
  const preset = block.orbitals;

  function moveTab(event, current) {
    const index = MODES.findIndex((item) => item.id === current);
    let nextIndex;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % MODES.length;
        break;
      case "ArrowLeft":
        nextIndex = (index + MODES.length - 1) % MODES.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = MODES.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = MODES[nextIndex].id;
    setMode(next);
    tabs.current[next]?.focus();
  }

  return (
    <section className={`${styles.card} ${styles.bohrCard}`}>
      <span className={styles.cardEyebrow}>Electronic structure</span>
      <h3>{block.title}</h3>
      {preset ? (
        <>
          <div
            className={styles.structureTabs}
            role="tablist"
            aria-label={`${element.name} electronic structure view`}
          >
            {MODES.map((item) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[item.id] = node;
                }}
                type="button"
                role="tab"
                id={`${id}-${item.id}-tab`}
                aria-controls={`${id}-${item.id}-panel`}
                aria-selected={mode === item.id}
                tabIndex={mode === item.id ? 0 : -1}
                onClick={() => setMode(item.id)}
                onKeyDown={(event) => moveTab(event, item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {MODES.map((item) => (
            <div
              key={item.id}
              className={styles.structurePanel}
              id={`${id}-${item.id}-panel`}
              role="tabpanel"
              aria-labelledby={`${id}-${item.id}-tab`}
              hidden={mode !== item.id}
              tabIndex={0}
            >
              {mode === item.id &&
                (item.id === "shell" ? (
                  <BohrViewport element={element} />
                ) : (
                  <OrbitalBoundary>
                    <OrbitalViewport element={element} />
                  </OrbitalBoundary>
                ))}
            </div>
          ))}
        </>
      ) : (
        <BohrViewport element={element} />
      )}
      <p className={`${styles.configuration} ${styles.structureConfiguration}`}>
        {block.configuration}
        <span>Electron configuration</span>
      </p>
      <p className={styles.shells}>
        {element.shells?.join(" · ") || "Unavailable"}{" "}
        <span>electrons by shell</span>
      </p>
      <p className={styles.note}>
        {preset && mode === "orbitals"
          ? preset.modelNote
          : "A stylized shell model. Electrons are quantum objects, not particles following these literal paths. Sizes and motion are illustrative."}
      </p>
      {preset && mode === "orbitals" && (
        <div
          className={styles.structureSources}
          aria-label="Orbital references"
        >
          {preset.sources.map((source) => (
            <a
              key={source.url}
              className={styles.sourceLink}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.title} <ExternalLink aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
