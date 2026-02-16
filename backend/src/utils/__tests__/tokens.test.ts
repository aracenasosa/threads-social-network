import jwt from "jsonwebtoken";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  TokenPayload,
} from "../tokens";

describe("Token Utilities", () => {
  describe("signAccessToken", () => {
    it("should generate a valid access token", () => {
      const payload: TokenPayload = { userId: "123456789" };
      const token = signAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Verify the token can be decoded
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
      expect(decoded.userId).toBe(payload.userId);
    });

    it("should include expiration in the token", () => {
      const payload: TokenPayload = { userId: "123456789" };
      const token = signAccessToken(payload);

      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe("signRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const payload: TokenPayload = { userId: "987654321" };
      const token = signRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Verify the token can be decoded
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
      expect(decoded.userId).toBe(payload.userId);
    });

    it("should include expiration in the token", () => {
      const payload: TokenPayload = { userId: "987654321" };
      const token = signRefreshToken(payload);

      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it("should create different tokens for different users", () => {
      const payload1: TokenPayload = { userId: "user1" };
      const payload2: TokenPayload = { userId: "user2" };

      const token1 = signRefreshToken(payload1);
      const token2 = signRefreshToken(payload2);

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.verify(token1, REFRESH_TOKEN_SECRET) as TokenPayload;
      const decoded2 = jwt.verify(token2, REFRESH_TOKEN_SECRET) as TokenPayload;

      expect(decoded1.userId).toBe("user1");
      expect(decoded2.userId).toBe("user2");
    });
  });

  describe("Token verification", () => {
    it("should reject invalid access tokens", () => {
      expect(() => {
        jwt.verify("invalid.token.here", ACCESS_TOKEN_SECRET);
      }).toThrow();
    });

    it("should reject access token verified with wrong secret", () => {
      const payload: TokenPayload = { userId: "123" };
      const token = signAccessToken(payload);

      expect(() => {
        jwt.verify(token, "wrong-secret");
      }).toThrow();
    });
  });
});
