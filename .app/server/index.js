import express from "express";
import { generateRoutes } from "./utils/component-processor.js";
import { handlePageRequest, revalidatePath } from "./utils/router.js";
import { CLIENT_DIR } from "./utils/files.js";

// En producción (Vercel), los componentes y rutas ya están pre-generados
// En desarrollo, los generamos en cada inicio para hot-reload
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;

if (!isProduction) {
  const { initializeDirectories, generateComponentsAndFillCache } = await import("./utils/component-processor.js");
  await initializeDirectories();
  await generateComponentsAndFillCache();
  console.log("Components generated.");
}

// Cargar las rutas (ya generadas en producción, generadas ahora en desarrollo)
const { serverRoutes } = await generateRoutes();
console.log("Routes loaded.");

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

const PORT = process.env.PORT || 3000;

if (!isProduction) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export para Vercel
export default app;
