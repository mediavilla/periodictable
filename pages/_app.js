import { useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Head from "next/head";
import { ExplorerProvider } from "../components/explorer/ExplorerProvider";
import "../styles/globals.css";
import "../styles/explorer.css";
import "../styles/explorer-navigation.css";
const SceneCanvas = dynamic(
  () => import("../components/explorer/SceneCanvas"),
  { ssr: false },
);
export default function App({ Component, pageProps }) {
  const eventSource = useRef();
  const { basePath } = useRouter();
  return (
    <div
      ref={eventSource}
      style={{
        "--icon-18": `url("${basePath}/images/icon-18.svg")`,
        "--icon-32": `url("${basePath}/images/icon-32.svg")`,
        "--icon-rt": `url("${basePath}/images/icon-RT.svg")`,
      }}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <base href={`${basePath}/`} />
      </Head>
      <ExplorerProvider>
        <Component {...pageProps} />
        <SceneCanvas eventSource={eventSource} />
      </ExplorerProvider>
    </div>
  );
}
