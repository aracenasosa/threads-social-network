import { User } from "../user.model";

describe("User Model", () => {
  describe("User creation", () => {
    it("should create a valid user", async () => {
      const userData = {
        userName: "johndoe",
        fullName: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      expect(user.userName).toBe("johndoe");
      expect(user.fullName).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
      expect(user._id).toBeDefined();
    });

    it("should create user with Google auth (no password)", async () => {
      const userData = {
        userName: "janedoe",
        fullName: "Jane Doe",
        email: "jane@example.com",
        googleId: "google123",
      };

      const user = await User.create(userData);

      expect(user.userName).toBe("janedoe");
      expect(user.email).toBe("jane@example.com");
      expect(user._id).toBeDefined();
    });

    it("should normalize username to lowercase", async () => {
      const userData = {
        userName: "JohnDoe",
        fullName: "John Doe",
        email: "john2@example.com",
        password: "password123",
      };

      const user = await User.create(userData);
      expect(user.userName).toBe("johndoe");
    });

    it("should normalize email to lowercase", async () => {
      const userData = {
        userName: "johndoe2",
        fullName: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      };

      const user = await User.create(userData);
      expect(user.email).toBe("john@example.com");
    });
  });

  describe("User validation", () => {
    it("should reject username shorter than 6 characters", async () => {
      const userData = {
        userName: "john",
        fullName: "John Doe",
        email: "john3@example.com",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should reject username longer than 20 characters", async () => {
      const userData = {
        userName: "thisusernameiswaytoolong",
        fullName: "John Doe",
        email: "john4@example.com",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should reject invalid email format", async () => {
      const userData = {
        userName: "johndoe3",
        fullName: "John Doe",
        email: "invalid-email",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should reject duplicate username", async () => {
      const userData1 = {
        userName: "unique1",
        fullName: "John Doe",
        email: "john5@example.com",
        password: "password123",
      };

      const userData2 = {
        userName: "unique1",
        fullName: "Jane Doe",
        email: "jane5@example.com",
        password: "password123",
      };

      await User.create(userData1);
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it("should reject duplicate email", async () => {
      const userData1 = {
        userName: "unique2",
        fullName: "John Doe",
        email: "same@example.com",
        password: "password123",
      };

      const userData2 = {
        userName: "unique3",
        fullName: "Jane Doe",
        email: "same@example.com",
        password: "password123",
      };

      await User.create(userData1);
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it("should reject bio longer than 160 characters", async () => {
      const userData = {
        userName: "johndoe4",
        fullName: "John Doe",
        email: "john6@example.com",
        password: "password123",
        bio: "a".repeat(161),
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe("Password hashing", () => {
    it("should hash password on save", async () => {
      const userData = {
        userName: "secureuser",
        fullName: "Secure User",
        email: "secure@example.com",
        password: "mypassword",
      };

      const user = await User.create(userData);
      const savedUser = await User.findById(user._id).select("+password");

      expect(savedUser!.password).toBeDefined();
      expect(savedUser!.password).not.toBe("mypassword");
      expect(savedUser!.password!.length).toBeGreaterThan(20); // Bcrypt hash
    });

    it("should reject password shorter than 6 characters", async () => {
      const userData = {
        userName: "shortpw",
        fullName: "Short Password User",
        email: "short@example.com",
        password: "12345",
      };

      await expect(User.create(userData)).rejects.toThrow(
        "Password must be at least 6 characters long",
      );
    });

    it("should reject password longer than 30 characters", async () => {
      const userData = {
        userName: "longpw",
        fullName: "Long Password User",
        email: "long@example.com",
        password: "a".repeat(31),
      };

      await expect(User.create(userData)).rejects.toThrow(
        "Password must be at most 30 characters long",
      );
    });

    it("should compare password correctly", async () => {
      const userData = {
        userName: "compareuser",
        fullName: "Compare User",
        email: "compare@example.com",
        password: "testpass123",
      };

      const user = await User.create(userData);
      const savedUser = await User.findById(user._id).select("+password");

      const isMatch = await savedUser!.comparePassword("testpass123");
      expect(isMatch).toBe(true);

      const isWrong = await savedUser!.comparePassword("wrongpassword");
      expect(isWrong).toBe(false);
    });
  });

  describe("Refresh token handling", () => {
    it("should hash refresh token on save", async () => {
      const userData = {
        userName: "tokenuser",
        fullName: "Token User",
        email: "token@example.com",
        password: "password123",
      };

      const user = await User.create(userData);
      const rawToken = "refreshtokenstring";

      user.refreshToken = rawToken;
      await user.save();

      const savedUser = await User.findById(user._id);
      expect(savedUser!.refreshToken).toBeDefined();
      expect(savedUser!.refreshToken).not.toBe(rawToken);
    });

    it("should compare refresh token correctly", async () => {
      const userData = {
        userName: "refreshuser",
        fullName: "Refresh User",
        email: "refresh@example.com",
        password: "password123",
      };

      const user = await User.create(userData);
      const rawToken = "myrefreshtoken123";

      user.refreshToken = rawToken;
      await user.save();

      const savedUser = await User.findById(user._id);
      const isMatch = await savedUser!.compareRefreshToken(rawToken);
      expect(isMatch).toBe(true);

      const isWrong = await savedUser!.compareRefreshToken("wrongtoken");
      expect(isWrong).toBe(false);
    });
  });

  describe("Timestamps", () => {
    it("should automatically add createdAt and updatedAt", async () => {
      const userData = {
        userName: "timestampuser",
        fullName: "Timestamp User",
        email: "timestamp@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
