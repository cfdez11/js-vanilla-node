import {
  generateComponentsAndFillCache,
  generateRoutes,
} from "./utils/component-processor.js";
import { initializeDirectories } from "./utils/files.js";

console.log("🔨 Starting prebuild...");

// Initialize directories first
console.log("📁 Creating directories...");
await initializeDirectories();

// Pre-generate all client and server components
console.log("⚙️  Generating components...");
await generateComponentsAndFillCache();

// Generate routes automatically
console.log("🛣️  Generating routes...");
await generateRoutes();

console.log("✅ Prebuild complete!");
