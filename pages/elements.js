import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import FooterViewport from "../components/explorer/FooterViewport";
import ExplorerNavigation from "../components/explorer/ExplorerNavigation";
import elements from "../public/elements.json";
import { categoryColor } from "../data/table-registry";
import { getElementContent } from "../data/element-content";
import BohrViewport from "../components/explorer/BohrViewport";
import { useRouter } from "next/router";
import { assetPath } from "../utils/assetPath";

const features = [
  {
    number: 1,
    title: "The smallest atom. The biggest story.",
    description: "From a single proton to the reactions that power the Sun.",
    background: "#f6dfed",
  },
  {
    number: 6,
    title: "Same atoms. Different worlds.",
    description: "Diamond, graphite, and the extraordinary ability to connect.",
    background: "#e4eafa",
  },
  {
    number: 79,
    title: "More than a precious metal.",
    description:
      "Follow gold from delicate leaf to a telescope that sees deep into space.",
    background: "#f4e586",
  },
];

export default function Elements() {
  const { basePath } = useRouter();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return elements;
    if (/^\d+$/.test(term))
      return elements.filter((element) => element.number === Number(term));
    return elements.filter(
      (element) =>
        element.name.toLowerCase().includes(term) ||
        element.symbol.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <>
      <Head>
        <title>Elements · Explore the periodic table</title>
        <meta
          name="description"
          content="Discover all 118 elements through their properties, electron shells, and stories. Explore hydrogen, carbon, gold, and the elements that make our world."
        />
      </Head>
      <main className="explorerPage">
        <ExplorerNavigation />
        <div className="explorerDiscovery">
          <header className="explorerDiscoveryLead">
            <span>118 elements. Countless connections.</span>
            <h1>
              The ingredients
              <br />
              of everything.
            </h1>
            <p>
              Start with an atom. Discover the structures, materials, and
              stories it makes possible.
            </p>
          </header>
          <div
            className="explorerFeatures"
            aria-label="Featured element stories"
          >
            {features.map((feature) => {
              const element = elements.find(
                (item) => item.number === feature.number,
              );
              const media = getElementContent(element).blocks.find(
                (block) => block.type === "image",
              );
              return (
                <Link
                  key={element.number}
                  href={`/${element.name.toLowerCase()}/`}
                  className="explorerFeature"
                  style={{ "--feature-bg": feature.background }}
                >
                  <small>
                    {element.name} / {String(element.number).padStart(2, "0")}
                  </small>
                  <b aria-hidden="true">{element.symbol}</b>
                  <div className="explorerFeatureArt">
                    {element.number === 1 ? (
                      <BohrViewport element={element} illustration />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetPath(media.src, basePath)}
                          alt={media.alt}
                          loading="lazy"
                          width="200"
                          height="160"
                        />
                        <small>{media.credit}</small>
                      </>
                    )}
                  </div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                  <span>
                    Explore {element.name.toLowerCase()}{" "}
                    <span aria-hidden="true">↗</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <section aria-labelledby="all-elements-heading">
            <div className="explorerSearchHeader">
              <div>
                <h2 id="all-elements-heading">Find your element.</h2>
                <p id="element-search-hint">
                  Search by name, symbol, or atomic number.
                </p>
              </div>
              <label className="explorerSearchInput">
                <span className="srOnly">Search all elements</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Hydrogen, Au, 79…"
                  aria-describedby="element-search-hint"
                  autoComplete="off"
                  spellCheck="false"
                />
                <span aria-hidden="true">⌕</span>
              </label>
            </div>
            <p className="explorerSearchCount" role="status" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "element" : "elements"}
              {query.trim() ? ` matching “${query.trim()}”` : " to discover"}
            </p>
            <div className="explorerElementGrid">
              {filtered.map((element) => (
                <Link
                  key={element.number}
                  href={`/${element.name.toLowerCase()}/`}
                  className="explorerElementLink"
                  style={{ "--tile-color": categoryColor(element.category) }}
                  aria-label={`${element.number}. ${element.name}, ${element.symbol}`}
                >
                  <small>{element.number}</small>
                  <b aria-hidden="true">{element.symbol}</b>
                  <span>{element.name}</span>
                </Link>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="explorerEmptySearch">
                No elements match this search. Try a name such as carbon, a
                symbol such as C, or a number from 1 to 118.
              </p>
            )}
          </section>
        </div>
      </main>
      <FooterViewport />
    </>
  );
}
