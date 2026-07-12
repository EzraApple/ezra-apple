import { createRoot } from "react-dom/client";
import "@fontsource-variable/instrument-sans/wdth.css";
import { listProjectSummaries } from "@/content/projects";
import { App } from "./App";
import { Providers } from "./providers";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <Providers>
    <App initialProjects={listProjectSummaries()} />
  </Providers>,
);
