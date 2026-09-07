import ElementFinder from "../components/explorer/ElementFinder";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import FooterViewport from "../components/explorer/FooterViewport";
import ExplorerNavigation from "../components/explorer/ExplorerNavigation";
import elements from "../public/elements.json";

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
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
          <ElementFinder expanded />
        </div>
      </main>
      <FooterViewport />
    </>
  );
}
