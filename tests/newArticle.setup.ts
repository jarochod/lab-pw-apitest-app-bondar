import { test as setup, expect } from "@playwright/test";

// s8-ch69 | 69. Project Setup and Teardown

setup("create new article", async ({ request }) => {
  // Create article via API to save execution time
  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "Likes test article",
          description: "This is a test description",
          body: "This is a test body",
          tagList: ["tag1 tag2"],
        },
      },
    },
  );

  // Assert that the article was successfully created on the server
  expect(articleResponse.status()).toEqual(201);

  // Extract and share slug ID via environment variable for the teardown phase
  const responseBody = await articleResponse.json();
  const slugID = responseBody.article.slug;
  process.env["SLUGID"] = slugID;
});
