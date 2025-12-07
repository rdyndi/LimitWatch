
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root tidak ditemukan");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mendaftarkan service worker untuk kapabilitas PWA dan offline
serviceWorkerRegistration.register();
