import { User } from "../user.model";
import { Post } from "../post.model";

describe("Post Model", () => {
  let testUser: any;

  beforeEach(async () => {
    // Create a test user for post authorship
    testUser = await User.create({
      userName: "postauthor",
      fullName: "Post Author",
      email: "author@example.com",
      password: "password123",
    });
  });

  describe("Post creation", () => {
    it("should create a valid post with required fields", async () => {
      const postData = {
        author: testUser._id,
        text: "This is a test post",
      };

      const post = await Post.create(postData);

      expect(post.text).toBe("This is a test post");
      expect(post.author.toString()).toBe(testUser._id.toString());
      expect(post.likesCount).toBe(0);
      expect(post.repliesCount).toBe(0);
      expect(post.isEdited).toBe(false);
      expect(post._id).toBeDefined();
    });

    it("should create a post without text", async () => {
      const postData = {
        author: testUser._id,
      };

      const post = await Post.create(postData);

      expect(post.author.toString()).toBe(testUser._id.toString());
      expect(post.text).toBeUndefined();
    });

    it("should create a reply post with parentPost", async () => {
      const parentPost = await Post.create({
        author: testUser._id,
        text: "Parent post",
      });

      const replyData = {
        author: testUser._id,
        text: "This is a reply",
        parentPost: parentPost._id,
        rootPost: parentPost._id,
      };

      const reply = await Post.create(replyData);

      expect(reply.parentPost!.toString()).toBe(parentPost._id.toString());
      expect(reply.rootPost!.toString()).toBe(parentPost._id.toString());
    });

    it("should create nested reply with correct rootPost", async () => {
      const rootPost = await Post.create({
        author: testUser._id,
        text: "Root post",
      });

      const firstReply = await Post.create({
        author: testUser._id,
        text: "First reply",
        parentPost: rootPost._id,
        rootPost: rootPost._id,
      });

      const nestedReply = await Post.create({
        author: testUser._id,
        text: "Nested reply",
        parentPost: firstReply._id,
        rootPost: rootPost._id,
      });

      expect(nestedReply.parentPost!.toString()).toBe(
        firstReply._id.toString(),
      );
      expect(nestedReply.rootPost!.toString()).toBe(rootPost._id.toString());
    });
  });

  describe("Post validation", () => {
    it("should reject post without author", async () => {
      const postData = {
        text: "Post without author",
      };

      await expect(Post.create(postData)).rejects.toThrow();
    });

    it("should reject post with text exceeding max length", async () => {
      const longText = "a".repeat(501); // Assuming MAX_TEXT_LENGTH is 500

      const postData = {
        author: testUser._id,
        text: longText,
      };

      await expect(Post.create(postData)).rejects.toThrow();
    });

    it("should trim whitespace from text", async () => {
      const postData = {
        author: testUser._id,
        text: "  Text with spaces  ",
      };

      const post = await Post.create(postData);
      expect(post.text).toBe("Text with spaces");
    });
  });

  describe("Post defaults", () => {
    it("should default likesCount to 0", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.likesCount).toBe(0);
    });

    it("should default repliesCount to 0", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.repliesCount).toBe(0);
    });

    it("should default isEdited to false", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.isEdited).toBe(false);
    });

    it("should default parentPost to null", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.parentPost).toBeNull();
    });

    it("should default rootPost to null", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.rootPost).toBeNull();
    });
  });

  describe("Post updates", () => {
    it("should update post text and set isEdited", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Original text",
      });

      post.text = "Updated text";
      post.isEdited = true;
      await post.save();

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost!.text).toBe("Updated text");
      expect(updatedPost!.isEdited).toBe(true);
    });

    it("should increment likesCount", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      post.likesCount += 1;
      await post.save();

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost!.likesCount).toBe(1);
    });

    it("should increment repliesCount", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      post.repliesCount += 1;
      await post.save();

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost!.repliesCount).toBe(1);
    });
  });

  describe("Timestamps", () => {
    it("should automatically add createdAt and updatedAt", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt when post is modified", async () => {
      const post = await Post.create({
        author: testUser._id,
        text: "Test",
      });

      const originalUpdatedAt = post.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      post.text = "Modified";
      await post.save();

      const updatedPost = await Post.findById(post._id);
      expect(updatedPost!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
