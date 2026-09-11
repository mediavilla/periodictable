import { Html, Head, Main, NextScript } from "next/document";
import { BotIdClient } from "botid/client";

const protectedRoutes = [
  {
    path: "/api/submissions",
    method: "POST",
  },
];

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <BotIdClient protect={protectedRoutes} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
