import { serializeMedia } from "./cloudinaryUpload";
import { serializeAuthor } from "./user";
import { PostNode, BuildTreeParamsRoot } from "../types/post.types";

export function idStr(x: any) {
  return x ? String(x) : "";
}

export function buildTree(
  params: BuildTreeParamsRoot & { sortBy?: "top" | "recent" },
): PostNode {
  const {
    root,
    descendants,
    usersById,
    mediaByPostId,
    likedPostIds,
    authorLikedPostIds,
    authorAvatarUrl,
    threadAuthorId,
    sortBy = "top", // Default to top if not provided
  } = params;

  const childrenByParent = new Map<string, any[]>();
  for (const d of descendants) {
    const parent = idStr(d.parentPost);
    if (!parent) continue;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent)!.push(d);
  }

  for (const [parentId, arr] of childrenByParent.entries()) {
    arr.sort((a, b) => {
      // Prioritize thread posts (posts created as part of the initial thread)
      // These have threadIndex >= 2 (since 1 is the root)
      const threadA = a.threadIndex || 0;
      const threadB = b.threadIndex || 0;

      if (threadA > 1 && threadB > 1) {
        return threadA - threadB; // Sort by index ascending
      }
      if (threadA > 1) return -1; // a comes first
      if (threadB > 1) return 1; // b comes first

      // Common date comparison
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortBy === "top") {
        const likesA = a.likesCount ?? 0;
        const likesB = b.likesCount ?? 0;
        const repliesA = a.repliesCount ?? 0;
        const repliesB = b.repliesCount ?? 0;

        const scoreA = likesA + repliesA;
        const scoreB = likesB + repliesB;

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return dateB - dateA;
      }

      return dateB - dateA;
    });
  }

  const hydrate = (node: any): PostNode => {
    const nodeId = idStr(node._id);
    const authorId = idStr(node.author);
    const author = usersById.get(authorId);

    return {
      _id: nodeId,
      parentPost: node.parentPost ? idStr(node.parentPost) : null,
      rootPost: node.rootPost ? idStr(node.rootPost) : null,
      text: node.text,
      likesCount: node.likesCount ?? 0,
      repliesCount: node.repliesCount ?? 0,
      isLiked: likedPostIds?.has(nodeId) ?? false,
      isLikedByAuthor: authorLikedPostIds?.has(nodeId) ?? false,
      authorAvatarUrl,
      threadAuthorId,
      isEdited: node.isEdited ?? false,
      threadIndex: node.threadIndex ?? null,
      threadTotal: node.threadTotal ?? null,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,

      // consistent author shape + avatarUrl (throws if author missing)
      author: serializeAuthor(author, authorId),

      // images become f_auto/q_auto and sized for full screen
      media: serializeMedia(mediaByPostId.get(nodeId) ?? [], "full"),

      replies: (childrenByParent.get(nodeId) ?? []).map(hydrate),
    };
  };

  return hydrate(root);
}
