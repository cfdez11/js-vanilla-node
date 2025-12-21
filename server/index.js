import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handlePageRequest, revalidatePath } from "./router.js";
import { generateComponentsAndFillCache, generateRoutes} from "./utils/component-processor.js";
import { initializeDirectories } from "./utils/files.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
await initializeDirectories();

console.warn("Starting server..." + new Date().toISOString());

// Pre-generate all client and server components to have their import statements ready
generateComponentsAndFillCache();
console.warn("Components generated." + new Date().toISOString());

// generate routes automatically
const { serverRoutes } = await generateRoutes();
console.warn("Routes generated." + new Date().toISOString());



const app = express();

app.use("/public", express.static(publicDir, {
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
