import { request, expect } from "@playwright/test";

// s8-ch70 | 70. Global Setup and Teardown

async function globalTeardown() {
  // 1. Context setup
  const context = await request.newContext();

  // 2. Delete the article using the dynamic slug ID and manual token authorization
  const deleteArticleResponse = await context.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${process.env.SLUGID}`,
    {
      headers: {
        Authorization: `Token ${process.env.ACCESS_TOKEN}`,
      },
    },
  );

  // 3. Validate successful deletion (204 No Content)
  expect(deleteArticleResponse.status()).toEqual(204);
}

export default globalTeardown;
