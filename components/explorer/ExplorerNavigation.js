import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import elements from "../../public/elements.json";
import { useRouter } from "next/router";
import { useExplorer } from "./ExplorerProvider";
import {
  designTables,
  chronologicalTables,
  categoryPastelColor,
} from "../../data/table-registry";

const destinations = [
  { href: "/", label: "Designs" },
  { href: "/timeline", label: "Timeline" },
  { href: "/elements", label: "Elements" },
];

function GiguereIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path d="M24 7 42 16v23l-18-9L6 39V16L24 7Z" fill="currentColor" />
      <path
        d="m6 16 18 9 18-9M24 7v36M6 39l18-9 18 9"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="m24 7 18 9v23l-18-9L6 39V16L24 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ExplorerNavigation({
  tables = false,
  timeline = false,
}) {
  const router = useRouter();
  const { design, changeDesign, destinationHref, reducedMotion } =
    useExplorer();
  const rowRef = useRef();
  const entries = timeline ? chronologicalTables : designTables;
  const elementMode =
    router.pathname === "/elements" || router.pathname === "/[element]";
  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector('[aria-pressed="true"]');
    if (!row || !selected) return;
    const bounds = row.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    const delta =
      item.left < bounds.left
        ? item.left - bounds.left
        : item.right > bounds.right
          ? item.right - bounds.right
          : 0;
    if (delta)
      row.scrollBy({
        left: delta,
        behavior: reducedMotion ? "auto" : "smooth",
      });
  }, [design.id, timeline, reducedMotion]);
  return (
    <nav className="explorerNav" aria-label="Periodic table navigation">
      <div className="explorerDestinations">
        <div className="explorerDestinationTabs">
          {destinations.map(({ href, label }) => (
            <Link
              key={href}
              href={destinationHref(href)}
              aria-current={
                router.pathname === href ||
                (href === "/elements" && elementMode)
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      {elementMode && (
        <div
          className="explorerDesigns explorerElementNav"
          role="group"
          aria-label="Browse elements"
          tabIndex={0}
        >
          {elements.map((element) => (
            <Link
              key={element.number}
              style={{ "--tile-color": categoryPastelColor(element.category) }}
              href={`/${element.name.toLowerCase()}/`}
              aria-current={
                router.query.element === element.name.toLowerCase()
                  ? "page"
                  : undefined
              }
            >
              <span className="explorerDesignIcon">{element.symbol}</span>
              <span>{element.name}</span>
            </Link>
          ))}
        </div>
      )}
      {tables && (
        <div
          ref={rowRef}
          className="explorerDesigns"
          tabIndex={0}
          role="group"
          aria-label={
            timeline ? "Choose a design by year" : "Choose a table design"
          }
        >
          {entries.map((table) => (
            <button
              key={table.id}
              type="button"
              aria-pressed={design.id === table.id}
              onClick={() => changeDesign(table.id)}
            >
              {timeline && (
                <span className="explorerNavYear">
                  {table.date || table.year}
                </span>
              )}
              <span className="explorerDesignIcon" aria-hidden="true">
                {!["18", "racetrack", "giguere"].includes(table.id) ? (
                  "◇"
                ) : table.id === "giguere" ? (
                  <GiguereIcon />
                ) : (
                  <Image
                    src={`${router.basePath}/images/${table.id === "racetrack" ? "icon-RT.svg" : "icon-18.svg"}`}
                    width={40}
                    height={40}
                    alt=""
                  />
                )}
              </span>
              <span>{table.shortName}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
