import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handlePageRequest } from "./router.js";
import { routes } from "./_app/_routes.js";
import { generateAllClientComponents, generateRoutes } from "./utils/component-processor.js";

// Pre-generate all client components to have their import statements ready
generateAllClientComponents();

// generate routes automatically
generateRoutes();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use("/public", express.static(path.join(__dirname, "../public")));

const registerSSRRoutes = (app, routes) => {
  routes.forEach((route) => {
    app.get(route.serverPath, async (req, res) => await handlePageRequest(req, res, route));
  });
};

registerSSRRoutes(app, routes);

app.use(async (req, res) => {
  const notFoundRoute = routes.find(r => r.isNotFound);
  if (notFoundRoute) {
    return handlePageRequest(req, res, notFoundRoute);
  }

  res.status(404).send("Page not found");
});

app.listen(3000, () => {
  console.log("Server running in http://localhost:3000");
});
