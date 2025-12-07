import { Router } from "./services/Router.js";
import "../components/counter.js";

window.app = {
  Router,
};

document.addEventListener("DOMContentLoaded", () => {
  app.Router.init();
});
