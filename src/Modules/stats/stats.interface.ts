export interface TagStat {
    tag: string;
    count: number;
}

export interface AuthorStat {
    authorId: string;
    name: string;
    postCount: number;
}

export interface MostCommentedPostStat {
    id: string;
    title: string;
    commentCount: number;
}

/** Public shape of GET /api/stats. */
export interface BlogStats {
    totalPublishedPosts: number;
    topTags: TagStat[];
    topAuthors: AuthorStat[];
    mostCommentedPosts: MostCommentedPostStat[];
}
