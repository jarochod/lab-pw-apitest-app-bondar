import { request, expect } from "@playwright/test";
import userTemplate from "./.auth/user.template.json";
import fs from "fs";

// s8-ch70 | 70. Global Setup and Teardown

async function globalSetup() {
  // 1. Context and paths setup
  const context = await request.newContext();
  const authFile = ".auth/user.json";

  // 2. Login and JWT token retrieval
  const response = await context.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "jarochod2012@gmail.com", password: "jarochod2012" },
      },
    },
  );
  const responseBodyToken = await response.json();
  const accessToken = responseBodyToken.user.token;

  // 3. Save auth state for UI tests and set environment variable
  userTemplate.origins[0].localStorage[0].value = accessToken;
  fs.writeFileSync(authFile, JSON.stringify(userTemplate, null, 2));
  process.env["ACCESS_TOKEN"] = accessToken;

  // 4. Create article with manual authorization (due to isolated API context)
  const articleResponse = await context.post(
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
      headers: {
        Authorization: `Token ${process.env.ACCESS_TOKEN}`,
      },
    },
  );

  // 5. Validation and saving article ID for teardown
  expect(articleResponse.status()).toEqual(201);
  const responseBody = await articleResponse.json();
  const slugID = responseBody.article.slug;
  process.env["SLUGID"] = slugID;
}

export default globalSetup;
