import { test, expect, request } from "@playwright/test";
import tags from "../test-data/tags.json";

// s7-ch54 | 54. Setup New Project
// s7-ch55 | 55. Mocking API
// s7-ch56 | 56. Modify API Response
// s7-ch57 | 57. Perform API Request

test.beforeEach(async ({ page }) => {
  // 1. Set up the interceptor before navigating
  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tags),
    });
  });

  // 2. Navigate to the app and Sign in
  await page.goto("https://conduit.bondaracademy.com/");
  await page.getByText("Sign in").click();
  await page.getByRole("textbox", { name: "Email" }).fill("jarochod2012@gmail.com");
  await page.getByRole("textbox", { name: "Password" }).fill("jarochod2012");
  await page.getByRole("button", { name: "Sign in" }).click();
});

test("has title and mocked tags", async ({ page }) => {

  // Intercept approach (Added in lesson): Modify live API response for articles
  await page.route("*/**/api/articles*", async (route) => {
    const response = await route.fetch(); // Fetch original response from real server
    const responseBody = await response.json(); // Parse it into a JavaScript object
    
    // Modify fields of the first article on the fly
    responseBody.articles[0].title = "This is a MOCK test title";
    responseBody.articles[0].description = "This is a MOCK description";

    // Fulfill route with intercepted and modified body
    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });


  await page.getByText("Global Feed").click();

  await expect(page.locator(".navbar-brand")).toHaveText("conduit");

  await expect(page.locator(".tag-list").first()).toContainText("Test");
  await expect(page.locator(".tag-list a").first()).toHaveText("Test", { useInnerText: true });

  // Check if the UI reacted correctly to the API modified on the fly
  // Verification using containText to check if the first h1 header and p paragraph contain the injected texts
  await expect(page.locator("app-article-list h1").first()).toContainText("This is a MOCK test title");
  await expect(page.locator("app-article-list P").first()).toContainText("This is a MOCK description");

  // Strict verification using toHaveText (the text must match 100%, not just partially)
  // The useInnerText: true option ignores hidden child elements and whitespaces, fetching the clean text visible to the user
  await expect(page.locator("app-article-list h1").first()).toHaveText("This is a MOCK test title", { useInnerText: true });
  await expect(page.locator("app-article-list P").first()).toHaveText("This is a MOCK description", { useInnerText: true });
});

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
          description: "This is a test desctiption",
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

