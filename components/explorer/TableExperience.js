import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { View } from "@react-three/drei";
import TableScene from "./TableScene";
import ExplorerNavigation from "./ExplorerNavigation";
import ElementDetail from "./ElementDetail";
import ElementFinder from "./ElementFinder";
import { useExplorer } from "./ExplorerProvider";
import elements from "../../public/elements.json";
import { categoryColor, tableSlots } from "../../data/table-registry";
import { slotLabel, slotNumbers } from "../../data/model-slots.mjs";
import FooterViewport from "./FooterViewport";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";

export default function TableExperience({ timeline = false }) {
  const {
    design,
    selected,
    setSelected,
    setHovered,
    active,
    activeSlot,
    panel,
    detailElement,
    detailSlot,
    openElement,
    openSlot,
    selectSlot,
    hoverSlot,
    openHistory,
    closePanel,
    issue,
    webglFailed,
    registerViewport,
  } = useExplorer();
  const viewRef = useRef();
  const panelRef = useRef();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    registerViewport("table", visible);
    return () => registerViewport("table", false);
  }, [visible, registerViewport]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (viewRef.current) observer.observe(viewRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (panel && document.activeElement !== viewRef.current)
      panelRef.current?.focus({ preventScroll: true });
  }, [panel, detailElement?.number]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && panel) {
        closePanel();
        return;
      }
      if (
        (panel && document.activeElement !== viewRef.current) ||
        document.activeElement?.closest(".explorerNav") ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      const next = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (next) {
        e.preventDefault();
        const slots = tableSlots(design.id);
        const index = slots.findIndex((slot) =>
          activeSlot
            ? slot.id === activeSlot.id
            : slotNumbers(slot).includes(selected.number),
        );
        const slot =
          slots[(Math.max(0, index) + next + slots.length) % slots.length];
        if (panel) openSlot(slot);
        else selectSlot(slot);
      }
      if (e.key === "Enter")
        activeSlot ? openSlot(activeSlot) : openElement(selected);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    panel,
    selected,
    activeSlot,
    design.id,
    closePanel,
    openElement,
    openSlot,
    selectSlot,
  ]);
  return (
    <>
      <Head>
        <title>{`${timeline ? "Timeline" : "Designs"} · The Periodic Table`}</title>
        <meta
          name="description"
          content="Explore historical and contemporary periodic table designs, their history, and the stories of 118 elements."
        />
      </Head>
      <main className="explorerPage">
        <ExplorerNavigation tables timeline={timeline} />
        <div className="explorerHeading">
          <div>
            <span className="explorerEyebrow">
              {timeline
                ? `${design.date} / ${design.creator}`
                : "One world. Many arrangements."}
            </span>
            <h1>{design.name}</h1>
          </div>
          {!panel && (
            <button className="explorerTextButton" onClick={openHistory}>
              About this design
            </button>
          )}
        </div>
        {timeline && <p className="explorerIntro">{design.introduction}</p>}
        <div
          className={`explorerStage ${panel ? "explorerPanelOpen" : ""} ${!panel && !activeSlot && !design.membership.includes(selected.number) ? "explorerHasNotice" : ""}`}
        >
          {!webglFailed && (
            <View
              ref={viewRef}
              className="explorerTableView"
              visible={visible}
              tabIndex={0}
              aria-label={`${design.name} interactive 3D table. Arrow keys select entries; Enter opens details.`}
            >
              <TableScene viewRef={viewRef} visible={visible} />
            </View>
          )}
          {panel ? (
            <>
              <div className="explorerPreviewActions">
                <button
                  className="explorerReturn"
                  onClick={closePanel}
                  aria-label="Return to table and restore camera"
                >
                  <ArrowLeft aria-hidden="true" /> Back to table
                </button>
                {!webglFailed && (
                  <TableCameraControls design={design} issue={issue} compact />
                )}
              </div>
              <div
                className="explorerPanel"
                ref={panelRef}
                tabIndex={-1}
                role="region"
                aria-label={
                  panel === "history"
                    ? "Design history"
                    : panel === "entry"
                      ? "Historical entry"
                      : `${detailElement?.name} detail`
                }
              >
                {panel === "element" &&
                  !design.membership.includes(detailElement.number) && (
                    <p className="explorerAbsent">
                      {detailElement.name} is not included in this historical
                      arrangement.
                    </p>
                  )}
                {panel === "element" ? (
                  <>
                    {detailSlot &&
                      (detailSlot.historical ||
                        detailSlot.note ||
                        detailSlot.mass != null) && (
                        <HistoricalContext slot={detailSlot} />
                      )}
                    <ElementDetail element={detailElement} compact />
                    <Link
                      className="explorerStandalone"
                      href={`/${detailElement.name.toLowerCase()}/`}
                    >
                      Open {detailElement.name} page{" "}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </>
                ) : panel === "entry" ? (
                  <HistoricalEntry
                    slot={detailSlot}
                    design={design}
                    openElement={openElement}
                  />
                ) : (
                  <DesignHistory design={design} />
                )}
              </div>
            </>
          ) : (
            <div className="explorerTools">
              <div
                className="explorerSelection"
                style={{
                  "--element-color":
                    activeSlot?.color || categoryColor(active.category),
                }}
              >
                <span className="explorerSymbol">
                  {activeSlot
                    ? slotLabel(activeSlot, elements).symbol
                    : active.symbol}
                </span>
                <div>
                  <strong>
                    {activeSlot
                      ? slotLabel(activeSlot, elements).name
                      : active.name}
                  </strong>
                  <span>
                    {activeSlot && !activeSlot.number
                      ? "Historical entry"
                      : `${active.number} · ${active.category}`}
                  </span>
                </div>
                <button
                  onClick={() =>
                    activeSlot ? openSlot(activeSlot) : openElement(active)
                  }
                >
                  {activeSlot && !activeSlot.number
                    ? "Explore entry"
                    : "Explore element"}{" "}
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
              {!activeSlot && !design.membership.includes(selected.number) && (
                <p className="explorerAbsent">
                  {selected.name} is not included in this historical
                  arrangement. Its detail is still available.
                </p>
              )}
              <TableCameraControls design={design} issue={issue} />
            </div>
          )}
          {webglFailed && (
            <div className="explorerFallback">
              <h2>Explore every element</h2>
              <p>
                The 3D view is unavailable on this device. Search and element
                stories remain available below.
              </p>
              <Link href="/elements/">
                Browse all elements <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
        {tableSlots(design.id).some((slot) => !slot.number) && (
          <details className="explorerKeyboard explorerSourceEntries">
            <summary>
              Entries in this edition{" "}
              <span>
                Original labels, including historical and unknown entries
              </span>
            </summary>
            <div className="explorerSearchResults">
              {tableSlots(design.id).map((slot) => {
                const label = slotLabel(slot, elements);
                return (
                  <button
                    key={slot.id}
                    className="explorerFinderCell"
                    style={{ "--tile-color": slot.color || "#eee9dc" }}
                    onFocus={() => hoverSlot(slot)}
                    onBlur={() => hoverSlot(null)}
                    onClick={() => openSlot(slot)}
                    aria-label={`${label.symbol}, ${label.name}${slot.mass != null ? `, historical weight ${slot.mass}` : ""}`}
                  >
                    <b>{label.symbol}</b>
                    <span>{label.name}</span>
                    <small>{slot.sourceNumber ?? slot.mass ?? ""}</small>
                  </button>
                );
              })}
            </div>
          </details>
        )}
        <ElementFinder
          expanded={webglFailed}
          onChoose={openElement}
          onFocus={(e) => {
            setSelected(e);
            setHovered(e);
          }}
          onBlur={() => setHovered(null)}
        />
      </main>
      <FooterViewport />
    </>
  );
}
function HistoricalContext({ slot }) {
  const label = slotLabel(slot, elements);
  return (
    <aside className="explorerAbsent">
      <strong>
        In this edition: {label.symbol}
        {slot.mass != null ? ` = ${slot.mass}` : ""}.
      </strong>{" "}
      {slot.note ||
        "The table retains its original notation. The element details below use current names and properties."}
      {slot.mass != null &&
        " Weights marked ‘source’ reproduce historical values and are not current atomic weights."}
    </aside>
  );
}
function HistoricalEntry({ slot, design, openElement }) {
  const label = slotLabel(slot, elements);
  return (
    <article className="explorerHistory">
      <span className="explorerEyebrow">An entry in {design.name}</span>
      <h2>
        {label.symbol} · {label.name}
      </h2>
      <p className="explorerHistoryLead">
        {slot.note ||
          "This position is retained from the source figure. It is not a separately identified modern element."}
      </p>
      {slot.sourceNumber != null && (
        <p>
          Printed position: {slot.sourceNumber}. A numbered position does not
          imply that an element was known when this table was drawn.
        </p>
      )}
      {slot.mass != null && (
        <p>
          Historical weight: {slot.mass}. This is the value printed in the
          source, not a modern atomic weight.
        </p>
      )}
      {!!slotNumbers(slot).length && (
        <>
          <h3>Related modern elements</h3>
          <div className="explorerEntryLinks">
            {slotNumbers(slot).map((number) => (
              <button
                className="explorerTextButton"
                key={number}
                onClick={() => openElement(elements[number - 1])}
              >
                {elements[number - 1].name} <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
      <h3>Displayed edition</h3>
      <p>{design.edition}</p>
      <h3>Sources</h3>
      <ul>
        {design.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label} <ExternalLink aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
function DesignHistory({ design }) {
  return (
    <article className="explorerHistory">
      <span className="explorerEyebrow">The story of a design</span>
      <h2>{design.name}</h2>
      <p className="explorerHistoryLead">{design.introduction}</p>
      <dl>
        <div>
          <dt>Creator</dt>
          <dd>{design.creator}</dd>
        </div>
        <div>
          <dt>Design origin</dt>
          <dd>
            {design.date}
            {design.id === "18" ? " · an evolving convention" : ""}
          </dd>
        </div>
        <div>
          <dt>Displayed edition</dt>
          <dd>{design.edition}</dd>
        </div>
      </dl>
      <h3>Organizing principle</h3>
      <p>{design.principle}</p>
      <h3>Why it matters</h3>
      <p>{design.significance}</p>
      <h3>Sources & further reading</h3>
      <ul>
        {design.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label} <ExternalLink aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TableCameraControls({ design, issue, compact = false }) {
  return (
    <div
      className="explorerControls"
      role="group"
      aria-label="Table camera controls"
    >
      {!compact && (
        <span>
          {design.camera.orbit
            ? "Drag to orbit · pinch to zoom"
            : "Drag to move · pinch to zoom"}
        </span>
      )}
      <button
        onClick={() => issue("out")}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus aria-hidden="true" />
      </button>
      <button onClick={() => issue("in")} aria-label="Zoom in" title="Zoom in">
        <Plus aria-hidden="true" />
      </button>
      <button
        onClick={() => issue("reset")}
        aria-label="Reset camera"
        title="Reset camera"
      >
        <RotateCcw aria-hidden="true" />
        {!compact && " Reset"}
      </button>
    </div>
  );
}
