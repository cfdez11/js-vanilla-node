import { initializeRouter, navigate } from "./navigation.js";

window.app = {
  navigate,
};

document.addEventListener("DOMContentLoaded", () => {
  initializeRouter();
});
