# Blog API

Express, TypeScript, MongoDB, Mongoose, and Redis implementation of the Blog API assignment.

## Run locally

1. Copy `.env.example` to `.env` if you do not already have one, and add a valid `MONGODB_URI` ending in the `blog_pratush` database.
2. Start Redis locally (for example, `redis-server`), with Docker (`docker run --name blog-redis -p 6379:6379 redis:7-alpine`), or configure a Redis Cloud URL in `REDIS_URL`.
3. Start the API with `npm run dev`. The server starts only after MongoDB and Redis connect.

`REDIS_URL=redis://localhost:6379` is the default local setup. Use a `rediss://...` URL for a TLS-enabled managed Redis instance.

If Redis disconnects after startup, cache operations log the error and the API continues from MongoDB. Login rate limiting is the only Redis-only feature and is intentionally skipped during an outage.

## Redis keys

The project derives `blog_pratush:` from the MongoDB database name, so every key has the required prefix. Redis only stores public response data or session identifiers; it never stores a password.

| Key name | Redis type | TTL | Set / updated | Deleted / invalidated |
| --- | --- | --- | --- | --- |
| `blog_pratush:session:<token>` | String (`userId`) | Until the MongoDB session's `expiresAt` | Login; restored after a MongoDB session lookup | Logout, logout-all, expired naturally |
| `blog_pratush:user:<userId>:sessions` | Set of tokens | Until the newest session expires | Login | Logout removes one token; logout-all deletes the Set; expires naturally |
| `blog_pratush:user:<userId>` | JSON string | 1 hour | `GET /api/users/me` cache miss | `PATCH /api/users/me` |
| `blog_pratush:login:fail:<email>` | String counter | 15 minutes from first failure | Failed login | Successful login; expires naturally |
| `blog_pratush:post:<postId>` | JSON string | 10 minutes | Published `GET /api/posts/:id` cache miss | Post update/delete; comment add/delete |
| `blog_pratush:posts:list:version` | String integer | No expiry | Incremented after post/comment changes | Never deleted; old list keys simply become unreachable |
| `blog_pratush:posts:list:v<version>:p<page>:l<limit>:s<search>:t<tag>:o<sort>` | JSON string (full endpoint response) | 60 seconds | Public posts-list cache miss | Made unreachable by a version increment; expires naturally |
| `blog_pratush:stats` | JSON string | 5 minutes | Stats cache miss | Expires naturally |
| `blog_pratush:stats:lock` | String | 30 seconds | First concurrent stats cache miss | Removed after caching stats; expires as a safety net |

The statistics endpoint intentionally permits data up to five minutes old: it is a dashboard-style aggregate, while post and comment writes remain immediately correct in MongoDB and invalidate the post/list caches that expose live counts.

Cached GET responses send `X-Cache: MISS` when read from MongoDB and `X-Cache: HIT` when Redis supplies the same response body.
