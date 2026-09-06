import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useExplorer } from "./ExplorerProvider";
import { TABLES, chronologicalTables } from "../../data/table-registry";

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
  const { design, changeDesign } = useExplorer();
  const designs = timeline ? chronologicalTables : TABLES;

  return (
    <nav className="explorerNav" aria-label="Periodic table navigation">
      <div className="explorerDestinations">
        {destinations.map(({ href, label }) => (
          <Link
            key={href}
            href={
              href !== "/elements" && design.id !== "18"
                ? { pathname: href, query: { design: design.id } }
                : href
            }
            aria-current={router.pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
      {tables && (
        <div
          className="explorerDesigns"
          role="group"
          aria-label={
            timeline ? "Choose a design by year" : "Choose a table design"
          }
        >
          {designs.map((table) => (
            <button
              key={table.id}
              type="button"
              aria-pressed={design.id === table.id}
              onClick={() => changeDesign(table.id)}
            >
              <span
                className={`explorerDesignIcon${timeline ? " explorerYear" : ""}`}
              >
                {timeline ? (
                  table.date
                ) : table.id === "giguere" ? (
                  <GiguereIcon />
                ) : (
                  <Image
                    src={`${router.basePath}/images/${table.id === "racetrack" ? "icon-RT.svg" : "icon-18.svg"}`}
                    width={40}
                    height={40}
                    alt=""
                    aria-hidden="true"
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
