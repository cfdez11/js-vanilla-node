import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handlePageRequest } from "./router.js";
import { errorRoute, notFoundRoute, routes } from "./_app/routes.js"; // importa tambien el movie page por lo que hace fallar el html element not defined, hay que hacerlo de otra forma

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use("/public", express.static(path.join(__dirname, "../public")));

const registerSSRRoutes = (app, routes) => {
  routes.forEach((route) => {
    app.get(route.path, (req, res) => handlePageRequest(req, res, route));
  });
};

registerSSRRoutes(app, routes);

app.get(errorRoute.path, (req, res) => handlePageRequest(req, res, errorRoute));

app.use((req, res) => {
  res.status(404);
  handlePageRequest(req, res, notFoundRoute);
});

app.listen(3000, () => {
  console.log("Server running in http://localhost:3000");
});
