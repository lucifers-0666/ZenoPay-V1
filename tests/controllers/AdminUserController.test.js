/**
 * Admin User Controller Tests
 */

const request = require("supertest");
const mongoose = require("mongoose");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const bcrypt = require("bcryptjs");

describe("Admin User Controller", () => {
  let adminSession;
  let testUser;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const admin = new ZenoPayUser({
      ZenoPayID: "ZADMIN001",
      FullName: "Test Admin",
      Email: "admin@test.com",
      Password: hashedPassword,
      Role: "admin",
      DOB: new Date("1990-01-01"),
      Gender: "Male",
      Mobile: "9999999999",
      FatherName: "Test Father",
      Address: "Test Address",
      City: "Test City",
      State: "Test State",
      Pincode: "123456",
    });

    await admin.save();

    // Create test user
    testUser = new ZenoPayUser({
      ZenoPayID: "ZUSER001",
      FullName: "Test User",
      Email: "user@test.com",
      Password: await bcrypt.hash("User@123", 10),
      Role: "user",
      DOB: new Date("1995-01-01"),
      Gender: "Female",
      Mobile: "8888888888",
      FatherName: "Test Father",
      Address: "User Address",
      City: "User City",
      State: "User State",
      Pincode: "654321",
    });

    await testUser.save();
  });

  afterAll(async () => {
    await ZenoPayUser.deleteMany({});
  });

  describe("GET /admin/users", () => {
    it("should return list of users", async () => {
      const response = await request(app)
        .get("/admin/users?api=true")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/admin/users?api=true&page=1&limit=10")
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
    });

    it("should support search", async () => {
      const response = await request(app)
        .get("/admin/users?api=true&search=Test")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /admin/users/:id", () => {
    it("should return user details", async () => {
      const response = await request(app)
        .get(`/admin/users/${testUser._id}?api=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.FullName).toBe("Test User");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/admin/users/${fakeId}?api=true`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /admin/users/:id/suspend", () => {
    it("should suspend a user", async () => {
      const response = await request(app)
        .post(`/admin/users/${testUser._id}/suspend`)
        .send({ reason: "Test suspension" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Status).toBe("suspended");
    });
  });

  describe("POST /admin/users/:id/activate", () => {
    it("should activate a suspended user", async () => {
      await ZenoPayUser.findByIdAndUpdate(testUser._id, { Status: "suspended" });

      const response = await request(app)
        .post(`/admin/users/${testUser._id}/activate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.Status).toBe("active");
    });
  });

  describe("PUT /admin/users/:id", () => {
    it("should update user information", async () => {
      const response = await request(app)
        .put(`/admin/users/${testUser._id}`)
        .send({
          fullName: "Updated Name",
          email: "updated@test.com",
          mobile: "7777777777",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.FullName).toBe("Updated Name");
    });

    it("should not allow duplicate email", async () => {
      const response = await request(app)
        .put(`/admin/users/${testUser._id}`)
        .send({
          fullName: "Test",
          email: "admin@test.com",
          mobile: "7777777777",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Email already in use");
    });
  });
});
