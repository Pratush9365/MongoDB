/** OpenAPI 3 document for Part 7 bonus Swagger UI (no extra npm packages). */
export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "Blog API",
        version: "1.0.0",
        description:
            "Blog API with Express, TypeScript and Mongoose. Authenticate with `Authorization: Bearer <token>`.",
    },
    servers: [{ url: "/api", description: "API base path" }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "Session token",
            },
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                },
            },
            PublicUser: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            PublicPost: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    body: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    author: { type: "string" },
                    authorName: { type: "string" },
                    status: { type: "string", enum: ["draft", "published"] },
                    commentCount: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            PublicComment: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    postId: { type: "string" },
                    userId: { type: "string" },
                    userName: { type: "string" },
                    text: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Health check",
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { status: { type: "string", example: "ok" } },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/auth/signup": {
            post: {
                tags: ["Auth"],
                summary: "Create an account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "password"],
                                properties: {
                                    name: { type: "string", minLength: 2, maxLength: 50 },
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 8 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "User created" },
                    "400": { description: "Validation error" },
                    "409": { description: "Email already taken" },
                },
            },
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Log in (creates a session). Locked after 5 failed attempts in 15 minutes.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string" },
                                    password: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Returns token, expiresAt, user" },
                    "401": { description: "Invalid email or password" },
                    "429": { description: "Too many failed login attempts" },
                },
            },
        },
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Log out current session",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Logged out" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/auth/logout-all": {
            post: {
                tags: ["Auth"],
                summary: "Bonus: log out from every device",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "All sessions deleted" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/users/me": {
            get: {
                tags: ["Users"],
                summary: "Current user profile",
                security: [{ bearerAuth: [] }],
                responses: { "200": { description: "Profile (no password)" } },
            },
            patch: {
                tags: ["Users"],
                summary: "Update name only",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: { name: { type: "string" } },
                            },
                        },
                    },
                },
                responses: { "200": { description: "Updated profile" } },
            },
        },
        "/users/me/posts": {
            get: {
                tags: ["Posts"],
                summary: "Logged-in user's posts including drafts",
                security: [{ bearerAuth: [] }],
                responses: { "200": { description: "Array of posts" } },
            },
        },
        "/posts": {
            get: {
                tags: ["Posts"],
                summary: "Public list of published posts",
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
                    { name: "search", in: "query", schema: { type: "string" } },
                    { name: "tag", in: "query", schema: { type: "string" } },
                    {
                        name: "sort",
                        in: "query",
                        schema: { type: "string", enum: ["newest", "oldest", "mostCommented"] },
                    },
                ],
                responses: { "200": { description: "Paginated posts (no body field)" } },
            },
            post: {
                tags: ["Posts"],
                summary: "Create a post",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "body"],
                                properties: {
                                    title: { type: "string" },
                                    body: { type: "string" },
                                    tags: { type: "array", items: { type: "string" }, maxItems: 5 },
                                    status: { type: "string", enum: ["draft", "published"] },
                                },
                            },
                        },
                    },
                },
                responses: { "201": { description: "Created" } },
            },
        },
        "/posts/{id}": {
            get: {
                tags: ["Posts"],
                summary: "Get one published post",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Post" },
                    "400": { description: "Invalid id" },
                    "404": { description: "Not found" },
                },
            },
            patch: {
                tags: ["Posts"],
                summary: "Update own post",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Updated" },
                    "403": { description: "Not the author" },
                },
            },
            delete: {
                tags: ["Posts"],
                summary: "Delete own post (and its comments)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Deleted" } },
            },
        },
        "/posts/{id}/comments": {
            get: {
                tags: ["Comments"],
                summary: "List comments (page or cursor with ?after=)",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "page", in: "query", schema: { type: "integer" } },
                    { name: "limit", in: "query", schema: { type: "integer" } },
                    {
                        name: "after",
                        in: "query",
                        description: "Bonus cursor: last comment id from the previous page",
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "Comments + pagination" } },
            },
            post: {
                tags: ["Comments"],
                summary: "Add a comment on a published post",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["text"],
                                properties: { text: { type: "string", maxLength: 500 } },
                            },
                        },
                    },
                },
                responses: { "201": { description: "Created" } },
            },
        },
        "/comments/{id}": {
            delete: {
                tags: ["Comments"],
                summary: "Delete comment (author or post author)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Deleted" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/stats": {
            get: {
                tags: ["Stats"],
                summary: "Public blog statistics ($facet aggregation)",
                responses: { "200": { description: "Stats payload" } },
            },
        },
    },
} as const;

export function swaggerUiHtml(openapiUrl: string): string {
    const safeUrl = JSON.stringify(openapiUrl);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Blog API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: ${safeUrl},
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>`;
}
