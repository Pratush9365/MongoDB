import { postRepo } from "../../Repository/post.repository";
import type { PostRepository } from "../../Repository/post.repository";
import type { BlogStats } from "./stats.interface";

export class StatsService {
    public constructor(private readonly posts: PostRepository = postRepo) {}

    /** Builds the public stats response from one $facet aggregation. */
    public async getBlogStats(): Promise<BlogStats> {
        const raw = await this.posts.getPublishedStats();

        return {
            totalPublishedPosts: raw.totalPublished[0]?.count ?? 0,
            topTags: raw.topTags,
            topAuthors: raw.topAuthors.map((author) => ({
                authorId: String(author.authorId),
                name: author.name,
                postCount: author.postCount,
            })),
            mostCommentedPosts: raw.mostCommented.map((post) => ({
                id: String(post.id),
                title: post.title,
                commentCount: post.commentCount,
            })),
        };
    }
}

export const statsService = new StatsService();
