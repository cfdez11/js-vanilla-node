import express from "express";
import { handlePageRequest, revalidatePath } from "./utils/router.js";
import { generateComponentsAndFillCache, generateRoutes} from "./utils/component-processor.js";
import { initializeDirectories, CLIENT_DIR } from "./utils/files.js";

await initializeDirectories();

// Pre-generate all client and server components to have their import statements ready
await generateComponentsAndFillCache();
console.log("Components generated.");

// generate routes automatically
const { serverRoutes } = await generateRoutes();
console.log("Routes generated.");


const app = express();

app.use("/.app/client", express.static(CLIENT_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

app.get("/revalidate", revalidatePath); 

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
