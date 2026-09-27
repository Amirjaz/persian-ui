// Full build: JavaScript and declarations with tsup, then the stylesheets.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
execSync("tsup", { stdio: "inherit" });
await import("./build-css.mjs");
