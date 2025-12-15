import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handlePageRequest } from "./router.js";
import { generateComponentsAndFillCache, generateRoutes} from "./utils/component-processor.js";

// Pre-generate all client and server components to have their import statements ready
await generateComponentsAndFillCache();

// generate routes automatically
const { serverRoutes } = await generateRoutes();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const app = express();

app.use("/public", express.static(publicDir));

const registerSSRRoutes = (app, routes) => {
  routes.forEach((route) => {
    app.get(route.serverPath, async (req, res) => await handlePageRequest(req, res, route));
  });
};

registerSSRRoutes(app, serverRoutes);

app.use(async (req, res) => {
  const notFoundRoute = serverRoutes.find(r => r.isNotFound);
  if (notFoundRoute) {
    return handlePageRequest(req, res, notFoundRoute);
  }

  res.status(404).send("Page not found");
});

app.listen(3000, () => {
  console.log("Server running in http://localhost:3000");
});
