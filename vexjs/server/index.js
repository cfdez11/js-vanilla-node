import "dotenv/config";
import express from "express";
import path from "path";
import { pathToFileURL } from "url";
import { handlePageRequest, revalidatePath } from "./utils/router.js";
import { initializeDirectories, CLIENT_DIR, USER_GENERATED_DIR } from "./utils/files.js";

await initializeDirectories();

let serverRoutes;

if (process.env.NODE_ENV === "production") {
  try {
    const routesPath = path.join(process.cwd(), ".vexjs", "_routes.js");
    const { routes } = await import(pathToFileURL(routesPath).href);
    serverRoutes = routes;
    console.log("Routes loaded.");
  } catch {
    console.error("ERROR: No build found. Run 'vex build' before starting in production.");
    process.exit(1);
  }
} else {
  const { build } = await import("./utils/component-processor.js");
  const result = await build();
  console.log("Components and routes generated.");
  serverRoutes = result.serverRoutes;
}

const app = express();

// Serve generated client component bundles at /_vexjs/_components/
app.use(
  "/_vexjs/_components",
  express.static(path.join(process.cwd(), ".vexjs", "_components"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Serve framework runtime JS + generated files (_routes.js) at /_vexjs/services/
// initializeDirectories() pre-populates this dir with framework files; build()
// adds generated files (_routes.js). Single source of truth for all /_vexjs/services/*.
app.use(
  "/_vexjs/services",
  express.static(path.join(process.cwd(), ".vexjs", "services"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Serve pre-bundled user JS utility files at /_vexjs/user/
// Registered before the generic /_vexjs mount so requests don't fall through
// to CLIENT_DIR unnecessarily. esbuild bundles each file with npm packages
// inlined; vex/*, @/*, and relative user imports stay external (singletons).
app.use(
  "/_vexjs/user",
  express.static(USER_GENERATED_DIR, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Serve static framework assets (favicon.ico, app.webmanifest) from CLIENT_DIR.
// Runtime JS files (reactive.js, index.js, etc.) are already in .vexjs/services/
// via initializeDirectories() and are served by the /_vexjs/services route above.
app.use(
  "/_vexjs",
  express.static(CLIENT_DIR, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Serve user's public directory at /
app.use("/", express.static(path.join(process.cwd(), "public")));

app.get("/revalidate", revalidatePath);

// HMR SSE endpoint — dev only
if (process.env.NODE_ENV !== "production") {
  const { hmrEmitter } = await import("./utils/hmr.js");

  app.get("/_vexjs/hmr", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const onReload = (filename) => {
      res.write(`event: reload\ndata: ${filename}\n\n`);
    };

    hmrEmitter.on("reload", onReload);
    req.on("close", () => hmrEmitter.off("reload", onReload));
  });
}

const registerSSRRoutes = (app, routes) => {
  routes.forEach((route) => {
    app.get(
      route.serverPath,
      async (req, res) => await handlePageRequest(req, res, route)
    );
  });
};

registerSSRRoutes(app, serverRoutes);

app.use(async (req, res) => {
  const notFoundRoute = serverRoutes.find((r) => r.isNotFound);
  if (notFoundRoute) {
    return handlePageRequest(req, res, notFoundRoute);
  }

  res.status(404).send("Page not found");
});

const PORT = process.env.VEX_PORT || process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
