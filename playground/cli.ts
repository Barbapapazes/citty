import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "../src";

const main = defineCommand({
  meta: {
    name: "citty",
    version: "1.0.0",
    description: "Citty playground CLI",
  },
  setup() {
    console.log("Setup");
  },
  cleanup() {
    console.log("Cleanup");
  },
  subCommands: {
    build: () => import("./cli/build").then((r) => r.default),
    deploy: () => import("./cli/deploy").then((r) => r.default),
    debug: () => import("./cli/debug").then((r) => r.default),
  },
});

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

runMain(main, {
  commandsDir: resolve("./commands"),
  modulesDir: resolve("./modules"),
});
