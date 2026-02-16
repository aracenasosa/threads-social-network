import { idStr, buildTree } from "../post";
import { BuildTreeParams, PostNode } from "../../../types/post.types";

describe("Post Utilities", () => {
  describe("idStr", () => {
    it("should convert object id to string", () => {
      const id = { _id: "123", toString: () => "123" };
      expect(idStr(id)).toBe("123");
    });

    it("should return empty string for null", () => {
      expect(idStr(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(idStr(undefined)).toBe("");
    });

    it("should handle string ids", () => {
      expect(idStr("abc123")).toBe("abc123");
    });
  });

  describe("buildTree", () => {
    const rootPost = {
      _id: "post1",
      text: "Root post",
      author: "user1",
      parentPost: null,
      rootPost: null,
      likesCount: 5,
      repliesCount: 2,
      isEdited: false,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const reply1 = {
      _id: "post2",
      text: "First reply",
      author: "user2",
      parentPost: "post1",
      rootPost: "post1",
      likesCount: 2,
      repliesCount: 0,
      isEdited: false,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    };

    const reply2 = {
      _id: "post3",
      text: "Second reply",
      author: "user1",
      parentPost: "post1",
      rootPost: "post1",
      likesCount: 10,
      repliesCount: 0,
      isEdited: false,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    };

    const user1 = {
      _id: "user1",
      userName: "john",
      fullName: "John Doe",
      profilePhoto: "https://example.com/john.jpg",
      profilePhotoPublicId: null,
    };

    const user2 = {
      _id: "user2",
      userName: "jane",
      fullName: "Jane Smith",
      profilePhoto: "https://example.com/jane.jpg",
      profilePhotoPublicId: null,
    };

    it("should build tree with no replies", () => {
      const usersById = new Map([["user1", user1]]);
      const mediaByPostId = new Map();
      const likedPostIds = new Set<string>();

      const params: BuildTreeParams = {
        root: rootPost,
        descendants: [],
        usersById,
        mediaByPostId,
        likedPostIds,
      };

      const tree = buildTree(params);

      expect(tree._id).toBe("post1");
      expect(tree.text).toBe("Root post");
      expect(tree.replies).toEqual([]);
      expect(tree.author.userName).toBe("john");
    });

    it("should build tree with replies sorted by top (engagement)", () => {
      const usersById = new Map([
        ["user1", user1],
        ["user2", user2],
      ]);
      const mediaByPostId = new Map();
      const likedPostIds = new Set<string>();

      const params: BuildTreeParams & { sortBy: "top" } = {
        root: rootPost,
        descendants: [reply1, reply2],
        usersById,
        mediaByPostId,
        likedPostIds,
        sortBy: "top",
      };

      const tree = buildTree(params);

      expect(tree.replies).toHaveLength(2);
      // reply2 has more likes (10) than reply1 (2), so should come first
      expect(tree.replies[0]._id).toBe("post3");
      expect(tree.replies[1]._id).toBe("post2");
    });

    it("should build tree with replies sorted by recent", () => {
      const usersById = new Map([
        ["user1", user1],
        ["user2", user2],
      ]);
      const mediaByPostId = new Map();
      const likedPostIds = new Set<string>();

      const params: BuildTreeParams & { sortBy: "recent" } = {
        root: rootPost,
        descendants: [reply1, reply2],
        usersById,
        mediaByPostId,
        likedPostIds,
        sortBy: "recent",
      };

      const tree = buildTree(params);

      expect(tree.replies).toHaveLength(2);
      // Most recent first (post3 created on Jan 3, post2 on Jan 2)
      expect(tree.replies[0]._id).toBe("post3");
      expect(tree.replies[1]._id).toBe("post2");
    });

    it("should mark posts as liked", () => {
      const usersById = new Map([["user1", user1]]);
      const mediaByPostId = new Map();
      const likedPostIds = new Set(["post1"]);

      const params: BuildTreeParams = {
        root: rootPost,
        descendants: [],
        usersById,
        mediaByPostId,
        likedPostIds,
      };

      const tree = buildTree(params);

      expect(tree.isLiked).toBe(true);
    });

    it("should include media if available", () => {
      const usersById = new Map([["user1", user1]]);
      const mediaByPostId = new Map([
        [
          "post1",
          [
            {
              publicId: "media1",
              type: "image" as const,
            },
          ],
        ],
      ]);
      const likedPostIds = new Set<string>();

      const params: BuildTreeParams = {
        root: rootPost,
        descendants: [],
        usersById,
        mediaByPostId,
        likedPostIds,
      };

      const tree = buildTree(params);

      expect(tree.media).toBeDefined();
      expect(Array.isArray(tree.media)).toBe(true);
    });
  });
});
