import request from "supertest";
import { User } from "../../models/user.model";
import app from "../../app";

describe("Auth Controller", () => {
  beforeEach(async () => {
    // Create a test user
    await User.create({
      userName: "testuser",
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials using email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User logged in successfully");
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userName).toBe("testuser");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should login with valid credentials using username", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.userName).toBe("testuser");
    });

    it("should normalize email/username to lowercase", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.user.userName).toBe("testuser");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid password");
    });

    it("should reject login with non-existent user", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should set refresh token cookie on successful login", async () => {
      const response = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(
        cookies.some((cookie: string) => cookie.startsWith("refreshToken=")),
      ).toBe(true);
    });

    it("should store hashed refresh token in database", async () => {
      await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      expect(user!.refreshToken).toBeDefined();
      expect(user!.refreshToken).not.toBe("");
      expect(user!.refreshToken!.length).toBeGreaterThan(20); // Should be bcrypt hash
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      // First login
      const loginResponse = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers["set-cookie"];
      expect(cookies).toBeDefined();

      // Then logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies!);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe("Logged out successfully");
    });

    it("should clear refresh token cookie on logout", async () => {
      // First login
      const loginResponse = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers["set-cookie"];
      expect(cookies).toBeDefined();

      // Then logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookies!);

      const setCookies = logoutResponse.headers[
        "set-cookie"
      ] as unknown as string[];
      expect(setCookies).toBeDefined();
      // Cookie should be cleared (expired or empty)
      expect(
        setCookies.some((cookie: string) => cookie.includes("refreshToken=")),
      ).toBe(true);
    });

    it("should clear refresh token from database", async () => {
      // First login
      const loginResponse = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers["set-cookie"];
      expect(cookies).toBeDefined();

      // Then logout
      await request(app).post("/api/auth/logout").set("Cookie", cookies!);

      const user = await User.findOne({ email: "test@example.com" });
      expect(user!.refreshToken).toBeNull();
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      // First login
      const loginResponse = await request(app).post("/api/auth/login").send({
        emailOrUsername: "test@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const oldAccessToken = loginResponse.body.accessToken;

      // Wait 1 second to ensure new token has different iat/exp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then refresh
      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookies!);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.accessToken).not.toBe(oldAccessToken);
    });

    it("should reject refresh without cookie", async () => {
      const response = await request(app).post("/api/auth/refresh");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Missing refresh token");
    });

    it("should reject refresh with invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refreshToken=invalid.token.here"]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid refresh token");
    });
  });
});
