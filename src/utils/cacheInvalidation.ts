import { redisKeys } from "../constants/redis";
import { delKeys, increment } from "./cache";

/** A version bump makes every old public-post-list key unreachable until its short TTL expires. */
export async function invalidatePostLists(): Promise<void> {
    await increment(redisKeys.postsListVersion());
}

/** Used after any change that affects one post and the public list's visible comment count. */
export async function invalidatePostAndLists(postId: string): Promise<void> {
    await delKeys(redisKeys.post(postId));
    await invalidatePostLists();
}
