import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/outfit";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/martian-mono";
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
