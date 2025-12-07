import { initializeRouter } from "./navigation.js";

window.app = {
  navigate,
};

document.addEventListener("DOMContentLoaded", () => {
  initializeRouter();
});
