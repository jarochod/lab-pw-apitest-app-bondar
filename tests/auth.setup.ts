import { test as setup } from "@playwright/test";

// s7-ch59 | 59. Sharing Authentication State

// Path where the authentication state will be stored
const authFile = ".auth/user.json";

setup("authentication", async ({ page }) => {
  // Navigate to the application
  await page.goto("https://conduit.bondaracademy.com/");

  // Perform UI login steps
  await page.getByText("Sign in").click();
  await page.getByRole("textbox", { name: "Email" }).fill("jarochod2012@gmail.com");
  await page.getByRole("textbox", { name: "Password" }).fill("jarochod2012");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for API response to ensure token is received and stored
  await page.waitForResponse("https://conduit-api.bondaracademy.com/api/tags");

  // Save storage state (cookies/localStorage) to JSON file
  await page.context().storageState({ path: authFile });
});
