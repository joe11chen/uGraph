import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const vditorPackageRoot = path.resolve(rootDir, "node_modules/vditor");

function contentType(filePath: string): string {
  const extension = path.extname(filePath);
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
  };
  return types[extension] ?? "application/octet-stream";
}

function vditorAssetsPlugin(): Plugin {
  return {
    name: "ugraph-vditor-assets",
    configureServer(server) {
      server.middlewares.use("/vditor", (request, response, next) => {
        const requestPath = decodeURIComponent((request.url ?? "/").split("?")[0]);
        const filePath = path.normalize(path.join(vditorPackageRoot, requestPath));

        if (!filePath.startsWith(vditorPackageRoot)) {
          response.statusCode = 403;
          response.end();
          return;
        }

        fs.stat(filePath, (statError, stat) => {
          if (statError || !stat.isFile()) {
            next();
            return;
          }
          response.setHeader("Content-Type", contentType(filePath));
          fs.createReadStream(filePath).pipe(response);
        });
      });
    },
    writeBundle(options) {
      const outputDir = typeof options.dir === "string" ? options.dir : path.resolve(rootDir, "dist");
      fs.cpSync(path.join(vditorPackageRoot, "dist"), path.join(outputDir, "vditor/dist"), { recursive: true });
    }
  };
}

export default defineConfig({
  plugins: [react(), vditorAssetsPlugin()],
  server: {
    port: 3000
  }
});
