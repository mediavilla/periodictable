import { Component, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import BohrViewport from "./BohrViewport";
import ConfigurationStrip from "./ConfigurationStrip";
import { createConfigurationModel } from "../../data/electron-configuration.mjs";
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

const SHELL_NOTE =
  "A stylized shell model. Electrons are quantum objects, not particles following these literal paths. Sizes and motion are illustrative.";

function StructureExplorer({ block, element }) {
  const preset = block.orbitals;
  const model = useMemo(() => createConfigurationModel(element), [element]);
  const [mode, setMode] = useState("shell");
  const [expanded, setExpanded] = useState(false);
  const [visibleSubshells, setVisibleSubshells] = useState(() =>
    model.entries.map((entry) => entry.id),
  );
  const [orientations, setOrientations] = useState(() =>
    Object.fromEntries(
      model.entries
        .filter((entry) => entry.l === 1)
        .map((entry) => [entry.id, "z"]),
    ),
  );
  const [sizeMode, setSizeMode] = useState("normalized");
  const [cutaway, setCutaway] = useState(false);
  const [paused, setPaused] = useState(false);
  const [highlightedShells, setHighlightedShells] = useState([]);
  const [stripPage, setStripPage] = useState(0);
  const modelNote =
    sizeMode === "ratios"
      ? preset.modelNote.replace(
          "Sizes are normalized for comparison.",
          "Sizes preserve hydrogen-like model ratios, not measured atom sizes.",
        )
      : preset.modelNote;
  const cameraRef = useRef(null);
  const id = useId();
  const tabs = useRef({});

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

  const toggleSubshell = (orbital) =>
    setVisibleSubshells((current) =>
      current.includes(orbital)
        ? current.filter((item) => item !== orbital)
        : model.entries
            .filter(
              (entry) => current.includes(entry.id) || entry.id === orbital,
            )
            .map((entry) => entry.id),
    );
  const toggleCore = () =>
    setVisibleSubshells((current) => {
      const core = model.core.ids;
      const allVisible = core.every((entry) => current.includes(entry));
      return allVisible
        ? current.filter((entry) => !core.includes(entry))
        : model.entries
            .filter(
              (entry) => current.includes(entry.id) || core.includes(entry.id),
            )
            .map((entry) => entry.id);
    });

  return (
    <section
      className={`${styles.card} ${styles.bohrCard} ${styles.structureExplorer}`}
      data-testid="electronic-structure"
      data-element={element.symbol}
    >
      <span className={styles.cardEyebrow}>Electronic structure</span>
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
      <div
        className={styles.structurePanel}
        id={`${id}-${mode}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${mode}-tab`}
        tabIndex={0}
      >
        <p className={styles.structureDescription}>
          {mode === "orbitals" ? modelNote : SHELL_NOTE}
        </p>
        <ConfigurationStrip
          model={model}
          mode={mode}
          expanded={expanded}
          onExpandedChange={setExpanded}
          visibleSubshells={visibleSubshells}
          onToggleSubshell={toggleSubshell}
          onToggleCore={toggleCore}
          onShowAll={() =>
            setVisibleSubshells(model.entries.map((entry) => entry.id))
          }
          onHideAll={() => setVisibleSubshells([])}
          orientations={orientations}
          onOrientationChange={(orbital, axis) =>
            setOrientations((current) => ({ ...current, [orbital]: axis }))
          }
          onHighlightShells={setHighlightedShells}
          page={stripPage}
          onPageChange={setStripPage}
        />
        {mode === "shell" ? (
          <BohrViewport
            element={element}
            paused={paused}
            onPausedChange={setPaused}
            highlightShells={highlightedShells}
          />
        ) : (
          <OrbitalBoundary>
            <OrbitalViewport
              element={element}
              preset={preset}
              visibleSubshells={visibleSubshells}
              orientations={orientations}
              sizeMode={sizeMode}
              onSizeModeChange={setSizeMode}
              cameraRef={cameraRef}
              cutaway={cutaway}
              onCutawayChange={setCutaway}
            />
          </OrbitalBoundary>
        )}
        {mode === "orbitals" && (
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
      </div>
      <div
        hidden
        role="tabpanel"
        id={`${id}-${mode === "shell" ? "orbitals" : "shell"}-panel`}
        aria-labelledby={`${id}-${mode === "shell" ? "orbitals" : "shell"}-tab`}
      />
    </section>
  );
}

export default function ElectronicStructure({ block, element }) {
  if (block.orbitals)
    return (
      <StructureExplorer key={element.number} block={block} element={element} />
    );
  return (
    <section className={`${styles.card} ${styles.bohrCard}`}>
      <span className={styles.cardEyebrow}>Electronic structure</span>
      <h3>{block.title}</h3>
      <BohrViewport element={element} />
      <p className={`${styles.configuration} ${styles.structureConfiguration}`}>
        {block.configuration}
        <span>Electron configuration</span>
      </p>
      <p className={styles.shells}>
        {element.shells?.join(" · ") || "Unavailable"}{" "}
        <span>electrons by shell</span>
      </p>
      <p className={styles.note}>{SHELL_NOTE}</p>
    </section>
  );
}
