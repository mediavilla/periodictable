import Head from "next/head";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import FooterViewport from "../components/explorer/FooterViewport";
import ExplorerNavigation from "../components/explorer/ExplorerNavigation";
import ElementDetail from "../components/explorer/ElementDetail";
import elements from "../public/elements.json";
import { getElementContent } from "../data/element-content";

export function getStaticPaths() {
  return {
    paths: elements.map((element) => ({
      params: { element: element.name.toLowerCase() },
    })),
    fallback: false,
  };
}

export function getStaticProps({ params }) {
  const slug = String(params?.element || "").toLowerCase();
  const element = elements.find((item) => item.name.toLowerCase() === slug);
  if (!element) return { notFound: true };
  return { props: { element } };
}

export default function ElementPage({ element }) {
  const content = getElementContent(element);
  return (
    <>
      <Head>
        <title>
          {element.name} ({element.symbol}) · Element {element.number}
        </title>
        <meta name="description" content={content.summary} />
      </Head>
      <main className="explorerPage">
        <ExplorerNavigation />
        <div className="explorerStandalonePage">
          <nav
            className="explorerElementBreadcrumb"
            aria-label="Element navigation"
          >
            <Link href="/elements/" className="breadcrumbLinkAllElements">
              <ArrowLeft aria-hidden="true" /> All elements
            </Link>
            <Link
              href={{
                pathname: "/",
                query: { element: element.name.toLowerCase() },
              }}
            >
              View in the table <ArrowRight aria-hidden="true" />
            </Link>
          </nav>
          <ElementDetail element={element} />
        </div>
      </main>
      <FooterViewport />
    </>
  );
}
