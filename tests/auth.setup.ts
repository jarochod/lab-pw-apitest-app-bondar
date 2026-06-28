import { test as setup } from "@playwright/test";
// Import the template file instead of the actual user.json
import userTemplate from "../.auth/user.template.json";
import fs from "fs";

// s7-ch59 | 59. Sharing Authentication State
// s7-ch60 | 60. API Authentication

// Path where the authentication state will be stored
const authFile = ".auth/user.json";

setup("authentication", async ({ page, request }) => {
  /* UI Authentication
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
*/

  // API Authentication
  // Send a POST request to the login endpoint with user credentials
  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "jarochod2012@gmail.com", password: "jarochod2012" },
      },
    },
  );

  // Parse the response body as JSON to extract data
  const responseBody = await response.json();

  // Extract the JWT access token from the response object
  const accessToken = responseBody.user.token;

  // Inject the obtained token into the local storage structure of the pre-existing user template
  userTemplate.origins[0].localStorage[0].value = accessToken;

  // Save the updated authentication state from the template to the actual auth file
  fs.writeFileSync(authFile, JSON.stringify(userTemplate, null, 2));

  // Set the access token as an environment variable for potential reuse in tests
  process.env["ACCESS_TOKEN"] = accessToken;
});