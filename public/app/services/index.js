import { Router } from "./navigation.js";

window.app = {
  Router,
};

document.addEventListener("DOMContentLoaded", () => {
  app.Router.init();
});
