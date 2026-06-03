import { test, expect } from "@playwright/test";
import tags from "../test-data/tags.json";

// s7-ch54 | 54. Setup New Project
// s7-ch55 | 55. Mocking API
// s7-ch56 | 56. Modify API Response
// s7-ch57 | 57. Perform API Request
// s7-ch58 | 58. Intercept Browser API Response

test.beforeEach(async ({ page }) => {
  // 1. Set up the interceptor for tags before navigating
  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tags),
    });
  });

  // 2. Navigate to the app and wait for the mocked tags response simultaneously
  await Promise.all([
    page.waitForResponse("*/**/api/tags"),
    page.goto("https://conduit.bondaracademy.com/")
  ]);
  // Sign in by UI
  await page.getByText("Sign in").click();
  await page.getByRole("textbox", { name: "Email" }).fill("jarochod2012@gmail.com");
  await page.getByRole("textbox", { name: "Password" }).fill("jarochod2012");
  await page.getByRole("button", { name: "Sign in" }).click();
});

test("has title and assertion mocked tags", async ({ page }) => {
  // 3. UI baseline verification - check elements that load immediately with the homepage
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");

  // These assertions are completely stable now because the page loaded with the mock data from the start
  await expect(page.locator(".tag-list").first()).toContainText("Automation");
  await expect(page.locator(".tag-list a").first()).toHaveText("Automation", { useInnerText: true });

  // 4. Intercept approach: Modify live API response for articles
  await page.route("*/**/api/articles*", async (route) => {
    const response = await route.fetch(); // Fetch original response from the real server
    const responseBody = await response.json(); // Parse it into a JavaScript object

    // Modify fields of the first article on the fly
    responseBody.articles[0].title = "This is a MOCK test title";
    responseBody.articles[0].description = "This is a MOCK description";

    // Fulfill route with the intercepted and modified body
    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });

  // 5. Synchronize the click and network response using Promise.all
  // This forces Playwright to wait for the background route.fetch() to complete before moving to assertions
  await Promise.all([
    page.waitForResponse('*/**/api/articles*'),
    page.getByText('Global Feed').click()
  ]);

  // 6. Check if the UI reacted correctly to the API modified on the fly
  await expect(page.locator("app-article-list h1").first()).toContainText("This is a MOCK test title");
  await expect(page.locator("app-article-list p").first()).toContainText("This is a MOCK description");

  // Strict verification using toHaveText (100% exact match)
  await expect(page.locator("app-article-list h1").first()).toHaveText("This is a MOCK test title", { useInnerText: true });
  await expect(page.locator("app-article-list p").first()).toHaveText("This is a MOCK description", { useInnerText: true });
});

// s7-ch57 | 57. Perform API Request
test("delete article", async ({ page, request }) => {
  // 1. Log in via API call to obtain the authorization token
  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "jarochod2012@gmail.com", password: "jarochod2012" },
      },
    },
  );

  // Extract the JWT access token from the response body
  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  // 2. Create a new article directly via API request to save execution time
  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "This is a test jarochod2012 title",
          description: "This is a test description",
          body: "This is a test body",
          tagList: ["tag1 tag2"],
        },
      },
      // Pass the extracted token in headers to authenticate the request
      headers: { Authorization: `Token ${accessToken}` },
    },
  );

  // Assert that the server successfully created the article (status 201 Created)
  expect(articleResponse.status()).toEqual(201);

  // 3. UI workflow - interact with the application using the browser page
  await page.getByText("Global Feed").click();

  // Click on the newly created article's title link
  await page.getByText("This is a test jarochod2012 title").click();

  // Click the delete button on the article details page
  await page.getByRole("button", { name: "Delete Article" }).first().click();

  // Return to the main feed to refresh the list of articles
  await page.getByText("Global Feed").click();

  // 4. Final verification - ensure that the deleted title no longer appears in the list
  await expect(page.locator("app-article-list h1").first()).not.toContainText("This is a test jarochod2012 title");
});

// s7-ch58 | 58. Intercept Browser API Response
test("create article", async ({ page, request }) => {
  // 1. UI WORKFLOW - Create a new article entirely via the user interface
  await page.getByRole("link", { name: "New Article" }).click();
  await page.getByRole('textbox', { name: 'Article Title' }).fill("Playwright is awesome");
  await page.getByRole("textbox", { name: "What's this article about?" }).fill("About the Playwright");
  await page.getByRole("textbox", { name: "Write your article (in markdown)" }).fill("We like to use Playwright for automation.");

  // 2. UI & NETWORK SYNCHRONIZATION (Parallel approach using Promise.all)
  // We intercept the browser's network traffic during the UI click.
  // This guarantees we capture the server response (and the slugID) without any race conditions.
  const [articleResponse] = await Promise.all([
    page.waitForResponse("**/api/articles/"),                     // Listen for the network response triggered by UI
    page.getByRole("button", { name: "Publish Article" }).click() // Trigger the response via UI click
  ]);

  // Extract the response body as a JSON object to fetch the unique slug ID for later API deletion
  const articleResponseBody = await articleResponse.json();
  const slugID = articleResponseBody.article.slug;

  // 3. UI VERIFICATION - Verify the article was created successfully in the frontend
  await expect(page.locator(".article-page h1")).toContainText("Playwright is awesome");

  // Navigate back to the global feed to ensure it appears in the list
  await page.getByRole("link", { name: "Home" }).click();
  await page.getByText("Global Feed").click();

  // Create a precise locator filtered by text to verify its presence in the feed list
  const myArticleLocator = page.locator("app-article-list h1").filter({ hasText: "Playwright is awesome" });
  await expect(myArticleLocator).toBeVisible();

  // 4. CLEANUP VIA API - Delete the created article directly via API to keep the state clean
  // Step 4a: Log in via API request to receive a valid authentication token
  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "jarochod2012@gmail.com", password: "jarochod2012" },
      },
    },
  );

  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  // Step 4b: Send a DELETE request using the dynamic slug ID fetched from the UI workflow step
  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugID}`, {
    headers: {
      "authorization": `Token ${accessToken}`
    }
  });

  // Assert that the article was successfully deleted on the server (204 No Content)
  expect(deleteArticleResponse.status()).toEqual(204);

  // 5. FINAL UI REFRESH - Refresh the global feed to complete the test lifecycle smoothly
  await page.getByText("Global Feed").click();
});
