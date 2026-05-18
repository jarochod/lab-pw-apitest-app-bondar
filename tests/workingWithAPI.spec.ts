import { test, expect } from "@playwright/test";
import tags from "../test-data/tags.json";

// s7-ch54 | 54. Setup New Project
// s7-ch55 | 55. Mocking API
// s7-ch56 | 56. Modify API Response

test.beforeEach(async ({ page }) => {
  // 1. Set up the interceptor before navigating
  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tags),
    });
  });

  // Intercept approach (Added in lesson): Modify live API response for articles
  await page.route("*/**/api/articles*", async (route) => {
    const response = await route.fetch(); // Fetch original response from real server
    const responseBody = await response.json(); // Parse it into a JavaScript object
    
    // Modify fields of the first article on the fly
    responseBody.articles[0].title = "This is a test title";
    responseBody.articles[0].description = "This is a description";

    // Fulfill route with intercepted and modified body
    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });

  // 2. Navigate to the app
  await page.goto("https://conduit.bondaracademy.com/");
});

test("has title and mocked tags", async ({ page }) => {

  await page.getByText("Global Feed").click();

  await expect(page.locator(".navbar-brand")).toHaveText("conduit");

  await expect(page.locator(".tag-list").first()).toContainText("Test");
  await expect(page.locator(".tag-list a").first()).toHaveText("Test", { useInnerText: true });

  // Check if the UI reacted correctly to the API modified on the fly
  // Verification using containText to check if the first h1 header and p paragraph contain the injected texts
  await expect(page.locator("app-article-list h1").first()).toContainText("This is a test title");
  await expect(page.locator("app-article-list P").first()).toContainText("This is a description");

  // Strict verification using toHaveText (the text must match 100%, not just partially)
  // The useInnerText: true option ignores hidden child elements and whitespaces, fetching the clean text visible to the user
  await expect(page.locator("app-article-list h1").first()).toHaveText("This is a test title", { useInnerText: true });
  await expect(page.locator("app-article-list P").first()).toHaveText("This is a description", { useInnerText: true });
});
