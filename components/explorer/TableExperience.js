import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { View } from "@react-three/drei";
import TableScene from "./TableScene";
import ExplorerNavigation from "./ExplorerNavigation";
import ElementDetail from "./ElementDetail";
import { useExplorer } from "./ExplorerProvider";
import elements from "../../public/elements.json";
import { categoryColor } from "../../data/table-registry";
import FooterViewport from "./FooterViewport";

export default function TableExperience({ timeline = false }) {
  const {
    design,
    selected,
    setSelected,
    setHovered,
    active,
    panel,
    detailElement,
    openElement,
    openHistory,
    closePanel,
    issue,
    webglFailed,
    registerViewport,
  } = useExplorer();
  const viewRef = useRef();
  const panelRef = useRef();
  const [visible, setVisible] = useState(true);
  const [search, setSearch] = useState("");
  const matches = elements.filter((e) =>
    `${e.number} ${e.name} ${e.symbol}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
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
    if (panel) panelRef.current?.focus({ preventScroll: true });
  }, [panel, detailElement?.number]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && panel) {
        closePanel();
        return;
      }
      if (
        panel ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      const next = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (next) {
        e.preventDefault();
        setSelected(elements[(selected.number - 1 + next + 118) % 118]);
      }
      if (e.key === "Enter") openElement(selected);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, selected, closePanel, openElement, setSelected]);
  return (
    <>
      <Head>
        <title>{`${timeline ? "Timeline" : "Designs"} · The Periodic Table`}</title>
        <meta
          name="description"
          content="Explore the periodic table through three designs, their history, and the stories of 118 elements."
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
          <button className="explorerTextButton" onClick={openHistory}>
            About this design ↗
          </button>
        </div>
        {timeline && (
          <p className="explorerIntro">
            {design.introduction}{" "}
            <button className="explorerInline" onClick={openHistory}>
              Read its history
            </button>
          </p>
        )}
        <div className={`explorerStage ${panel ? "explorerPanelOpen" : ""}`}>
          {!webglFailed && (
            <View
              ref={viewRef}
              className="explorerTableView"
              visible={visible}
              aria-label={`${design.name} interactive 3D table`}
            >
              <TableScene viewRef={viewRef} visible={visible} />
            </View>
          )}
          {panel ? (
            <>
              <button
                className="explorerReturn"
                onClick={closePanel}
                aria-label="Return to table and restore camera"
              >
                <span>↗ Return to table</span>
              </button>
              <div
                className="explorerPanel"
                ref={panelRef}
                tabIndex={-1}
                role="region"
                aria-label={
                  panel === "history"
                    ? "Design history"
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
                <button
                  className="explorerClose"
                  onClick={closePanel}
                  aria-label="Close details"
                >
                  ← Back to table
                </button>
                {panel === "element" ? (
                  <>
                    <ElementDetail element={detailElement} compact />
                    <Link
                      className="explorerStandalone"
                      href={`/${detailElement.name.toLowerCase()}/`}
                    >
                      Open {detailElement.name} page ↗
                    </Link>
                  </>
                ) : (
                  <DesignHistory design={design} />
                )}
              </div>
            </>
          ) : (
            <div className="explorerTools">
              <div
                className="explorerSelection"
                style={{ "--element-color": categoryColor(active.category) }}
              >
                <span className="explorerSymbol">{active.symbol}</span>
                <div>
                  <strong>{active.name}</strong>
                  <span>
                    {active.number} · {active.category}
                  </span>
                </div>
                <button onClick={() => openElement(active)}>
                  Explore element ↗
                </button>
              </div>
              {!design.membership.includes(selected.number) && (
                <p className="explorerAbsent">
                  {selected.name} is not included in this historical
                  arrangement. Its detail is still available.
                </p>
              )}
              <div
                className="explorerControls"
                aria-label="Table camera controls"
              >
                <span>
                  {design.camera.orbit
                    ? "Drag to orbit · pinch to zoom"
                    : "Drag to tilt · pinch to zoom"}
                </span>
                <button onClick={() => issue("out")} aria-label="Zoom out">
                  −
                </button>
                <button onClick={() => issue("in")} aria-label="Zoom in">
                  +
                </button>
                <button
                  onClick={() => issue("reset")}
                  aria-label="Reset camera"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
          {webglFailed && (
            <div className="explorerFallback">
              <h2>Explore every element</h2>
              <p>
                The 3D view is unavailable on this device. Search and element
                stories remain available below.
              </p>
              <Link href="/elements/">Browse all elements ↗</Link>
            </div>
          )}
        </div>
        <details className="explorerKeyboard" open={webglFailed || undefined}>
          <summary>
            Find an element <span>Search or use ← → then Enter</span>
          </summary>
          <label htmlFor="table-element-search">
            Name, symbol or atomic number
          </label>
          <input
            id="table-element-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try carbon, Au, or 79"
          />
          <div className="explorerSearchResults">
            {matches.map((e) => (
              <button
                key={e.number}
                onFocus={() => {
                  setSelected(e);
                  setHovered(e);
                }}
                onBlur={() => setHovered(null)}
                onClick={() => openElement(e)}
              >
                <b>{e.symbol}</b> {e.name} <small>{e.number}</small>
              </button>
            ))}
          </div>
          {!matches.length && <p>No elements found.</p>}
        </details>
      </main>
      <FooterViewport />
    </>
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
              {s.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
