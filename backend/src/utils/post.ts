import { serializeMedia } from "./cloudinaryUpload";
import { serializeAuthor } from "./user";
import { PostNode, BuildTreeParams } from "../types/post.types";

export function idStr(x: any) {
  return x ? String(x) : "";
}

export function buildTree(
  params: BuildTreeParams & { sortBy?: "top" | "recent" },
): PostNode {
  const {
    root,
    descendants,
    usersById,
    mediaByPostId,
    likedPostIds,
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
      // Common date comparison
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortBy === "top") {
        const likesA = a.likesCount ?? 0;
        const likesB = b.likesCount ?? 0;
        const repliesA = a.repliesCount ?? 0;
        const repliesB = b.repliesCount ?? 0;

        // Calculate engagement score
        // We can give equal weight or weighted. For now, simple sum of interactions.
        const scoreA = likesA + repliesA;
        const scoreB = likesB + repliesB;

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        // Fallback to recent
        return dateB - dateA;
      }

      // Default: "recent" (latest first) or "oldest" (if order='asc' passed manually)
      // The original code used `order` ('asc' or 'desc').
      // We will respect `sortBy='recent'` as 'desc'.
      // But if we want to keep `order` support, we can check it.
      // For this feature, 'Recent' implies DESC.
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
      text: node.text,
      likesCount: node.likesCount ?? 0,
      repliesCount: node.repliesCount ?? 0,
      isLiked: likedPostIds?.has(nodeId) ?? false,
      isEdited: node.isEdited ?? false,
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
