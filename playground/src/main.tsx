import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { App } from "./App";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

document.documentElement.lang = "en";
document.documentElement.dir = "ltr";

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
