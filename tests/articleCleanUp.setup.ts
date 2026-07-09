import { test as setup, expect } from "@playwright/test";

// s8-ch69 | 69. Project Setup and Teardown

setup("delete article", async ({ request }) => {
  // Delete the article using the dynamic slug ID from the setup phase
  const deleteArticleResponse = await request.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${process.env.SLUGID}`
  );

  // Assert that the article was successfully deleted (204 No Content)
  expect(deleteArticleResponse.status()).toEqual(204);
});
