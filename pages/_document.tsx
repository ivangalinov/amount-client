import { Html, Head, Main, NextScript } from "next/document";
import clsx from "clsx";

import { fontSans } from "@/config/fonts";
import { pwaConfig } from "@/config/pwa";

export default function Document() {
  return (
    <Html lang={pwaConfig.lang}>
      <Head>
        <link href="/manifest.webmanifest" rel="manifest" />
        <meta content={pwaConfig.themeColor} name="theme-color" />
        <meta content={pwaConfig.name} name="application-name" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content={pwaConfig.name} name="apple-mobile-web-app-title" />
        <meta
          content="default"
          name="apple-mobile-web-app-status-bar-style"
        />
        <link href="/favicon.ico" rel="icon" sizes="any" />
        <link
          href="/icons/icon-32.png"
          rel="icon"
          sizes="32x32"
          type="image/png"
        />
        <link
          href="/icons/icon-192.png"
          rel="icon"
          sizes="192x192"
          type="image/png"
        />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
      </Head>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
