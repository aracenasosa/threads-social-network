import { serializeMedia } from "./cloudinaryUpload";
import { serializeAuthor } from "./user";
import {
  PostNode,
  BuildTreeParams,
  MediaByPostMap,
  UsersByIdMap,
} from "../types/post.types";

export function idStr(x: any) {
  return x ? String(x) : "";
}

export function buildTree(params: BuildTreeParams): PostNode {
  const { root, descendants, usersById, mediaByPostId, order } = params;

  const childrenByParent = new Map<string, any[]>();
  for (const d of descendants) {
    const parent = idStr(d.parentPost);
    if (!parent) continue;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent)!.push(d);
  }

  for (const [parentId, arr] of childrenByParent.entries()) {
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return order === "asc" ? ta - tb : tb - ta;
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
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,

      // ✅ consistent author shape + avatarUrl (throws if author missing)
      author: serializeAuthor(author, authorId),

      // ✅ images become f_auto/q_auto and sized for full screen
      media: serializeMedia(mediaByPostId.get(nodeId) ?? [], "full"),

      replies: (childrenByParent.get(nodeId) ?? []).map(hydrate),
    };
  };

  return hydrate(root);
}
