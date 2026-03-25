import express from "express";
import { handlePageRequest, revalidatePath } from "./utils/router.js";
import { initializeDirectories, CLIENT_DIR } from "./utils/files.js";

await initializeDirectories();

let serverRoutes;

if (process.env.NODE_ENV === "production") {
  try {
    const { routes } = await import("./utils/_routes.js");
    serverRoutes = routes;
    console.log("Routes loaded.");
  } catch {
    console.error("ERROR: No build found. Run 'pnpm build' before starting in production.");
    process.exit(1);
  }
} else {
  const { generateComponentsAndFillCache, generateRoutes } = await import("./utils/component-processor.js");
  await generateComponentsAndFillCache();
  console.log("Components generated.");
  const result = await generateRoutes();
  console.log("Routes generated.");
  serverRoutes = result.serverRoutes;
}

const app = express();

app.use(
  "/.app/client",
  express.static(CLIENT_DIR, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

app.get("/revalidate", revalidatePath);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
