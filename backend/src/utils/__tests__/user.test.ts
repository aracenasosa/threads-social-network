import {
  formatUserResponse,
  formatUsersResponse,
  serializeAuthor,
} from "../user";
import { IUser } from "../../types/user.types";

describe("User Utilities", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    fullName: "John Doe",
    userName: "johndoe",
    email: "john@example.com",
    profilePhoto: "https://example.com/avatar.jpg",
    profilePhotoPublicId: undefined,
    location: "New York",
    bio: "Software developer",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  } as unknown as IUser;

  describe("formatUserResponse", () => {
    it("should format user with all fields", () => {
      const formatted = formatUserResponse(mockUser);

      expect(formatted).toEqual({
        id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        userName: "johndoe",
        email: "john@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
        location: "New York",
        bio: "Software developer",
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it("should handle missing optional fields", () => {
      const userWithoutOptional = {
        ...mockUser,
        location: undefined,
        bio: undefined,
        profilePhoto: "",
      } as unknown as IUser;

      const formatted = formatUserResponse(userWithoutOptional);

      expect(formatted.location).toBe("");
      expect(formatted.bio).toBe("");
      expect(formatted.avatarUrl).toBe("");
    });

    it("should convert _id to string id", () => {
      const formatted = formatUserResponse(mockUser);
      expect(formatted.id).toBe("507f1f77bcf86cd799439011");
      expect(typeof formatted.id).toBe("string");
    });
  });

  describe("formatUsersResponse", () => {
    it("should format multiple users", () => {
      const users = [
        mockUser,
        {
          ...mockUser,
          _id: "507f1f77bcf86cd799439012",
          userName: "janedoe",
          fullName: "Jane Doe",
        } as unknown as IUser,
      ];

      const formatted = formatUsersResponse(users);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].userName).toBe("johndoe");
      expect(formatted[1].userName).toBe("janedoe");
    });

    it("should return empty array for empty input", () => {
      const formatted = formatUsersResponse([]);
      expect(formatted).toEqual([]);
    });
  });

  describe("serializeAuthor", () => {
    it("should serialize author with basic info", () => {
      const author = {
        _id: "507f1f77bcf86cd799439011",
        userName: "johndoe",
        fullName: "John Doe",
        profilePhoto: "https://example.com/avatar.jpg",
        profilePhotoPublicId: undefined,
      };

      const serialized = serializeAuthor(author);

      expect(serialized).toEqual({
        _id: "507f1f77bcf86cd799439011",
        userName: "johndoe",
        fullName: "John Doe",
        avatarUrl: "https://example.com/avatar.jpg",
      });
    });

    it("should throw error if user is null", () => {
      expect(() => {
        serializeAuthor(null, "123");
      }).toThrow("user with id: 123 doesnt found in getPostFeed method");
    });

    it("should throw error if user is undefined", () => {
      expect(() => {
        serializeAuthor(undefined);
      }).toThrow();
    });

    it("should handle empty avatar", () => {
      const author = {
        _id: "507f1f77bcf86cd799439011",
        userName: "johndoe",
        fullName: "John Doe",
        profilePhoto: "",
        profilePhotoPublicId: undefined,
      };

      const serialized = serializeAuthor(author);
      expect(serialized.avatarUrl).toBe("");
    });
  });
});
