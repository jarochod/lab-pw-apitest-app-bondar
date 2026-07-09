import { defineConfig, devices } from "@playwright/test";

// s8-ch69 | 69. Project Setup and Teardown

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    // Automatically authorize all outgoing API requests using the token from auth setup
    extraHTTPHeaders: { Authorization: `Token ${process.env.ACCESS_TOKEN}` },
  },

  projects: [
    // --- PREPARATION PHASE (SETUP & TEARDOWN) ---
    {
      name: "setup",
      testMatch: "auth.setup.ts" // Generates the authentication state and access token
    },
    {
      name: "articleSetup",
      testMatch: "newArticle.setup.ts",
      dependencies: ["setup"], // Requires valid auth token before creating an article
      teardown: "articleCleanUp", // Triggers cleanup automatically after dependent tests finish
    },
    {
      name: "articleCleanUp",
      testMatch: "articleCleanUp.setup.ts"
    },

    // --- BROWSER TESTS ---
    {
      name: "regression",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json", // Inject saved auth state (cookies/localStorage)
      },
    },
    {
      name: "likeCounter",
      testMatch: "likesCounter.spec.ts",
      dependencies: ["articleSetup"], // Ensures fresh article is ready before test runs
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json", // Inject saved auth state to skip UI login
      },
    },
  ],
});
