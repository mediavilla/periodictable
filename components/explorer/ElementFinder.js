import { useId, useMemo, useState } from "react";
import Link from "next/link";
import elements from "../../public/elements.json";
import { categoryPastelColor } from "../../data/table-registry";

export default function ElementFinder({
  expanded = false,
  onChoose,
  onFocus,
  onBlur,
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return elements.filter(
      (e) =>
        !term ||
        (/^\d+$/.test(term)
          ? e.number === Number(term)
          : e.name.toLowerCase().includes(term) ||
            e.symbol.toLowerCase().includes(term)),
    );
  }, [query]);
  return (
    <details className="explorerKeyboard" open={expanded || undefined}>
      <summary>
        Find an element <span>Search by name, symbol or atomic number</span>
      </summary>
      <label htmlFor={id}>Name, symbol or atomic number</label>
      <input
        id={id}
        aria-label="Search all elements"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try carbon, Au, or 79"
      />
      <p className="explorerSearchCount" role="status">
        {matches.length} {matches.length === 1 ? "element" : "elements"}
      </p>
      <div className="explorerSearchResults">
        {matches.map((e) => {
          const props = {
            className: "explorerFinderCell",
            style: { "--tile-color": categoryPastelColor(e.category) },
            onFocus: () => onFocus?.(e),
            onBlur,
            "aria-label": `${e.number}. ${e.name}, ${e.symbol}`,
          };
          const content = (
            <>
              <b>{e.symbol}</b>
              <span>{e.name}</span>
              <small>{e.number}</small>
            </>
          );
          return onChoose ? (
            <button key={e.number} {...props} onClick={() => onChoose(e)}>
              {content}
            </button>
          ) : (
            <Link key={e.number} {...props} href={`/${e.name.toLowerCase()}/`}>
              {content}
            </Link>
          );
        })}
      </div>
      {!matches.length && <p>No elements found.</p>}
    </details>
  );
}
