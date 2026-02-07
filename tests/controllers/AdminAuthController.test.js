/**
 * Authentication Controller Tests
 */

const request = require("supertest");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const bcrypt = require("bcryptjs");

describe("Admin Auth Controller", () => {
  let testAdmin;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    testAdmin = new ZenoPayUser({
      ZenoPayID: "ZADMIN999",
      FullName: "Auth Test Admin",
      Email: "authtest@admin.com",
      Password: hashedPassword,
      Role: "admin",
      DOB: new Date("1990-01-01"),
      Gender: "Male",
      Mobile: "9876543210",
      FatherName: "Test Father",
      Address: "Test Address",
      City: "Test City",
      State: "Test State",
      Pincode: "123456",
    });

    await testAdmin.save();
  });

  afterAll(async () => {
    await ZenoPayUser.deleteMany({ Email: "authtest@admin.com" });
  });

  describe("POST /admin/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/admin/login")
        .send({
          zenoPayId: "authtest@admin.com",
          password: "Admin@123",
        })
        .expect(302); // Redirect on success

      expect(response.header.location).toBe("/admin/dashboard");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/admin/login")
        .send({
          zenoPayId: "authtest@admin.com",
          password: "WrongPassword",
        })
        .expect(200);

      expect(response.text).toContain("Invalid credentials");
    });

    it("should reject non-admin users", async () => {
      const regularUser = new ZenoPayUser({
        ZenoPayID: "ZUSER999",
        FullName: "Regular User",
        Email: "regular@user.com",
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

      await regularUser.save();

      const response = await request(app)
        .post("/admin/login")
        .send({
          zenoPayId: "regular@user.com",
          password: "User@123",
        })
        .expect(200);

      expect(response.text).toContain("Invalid credentials or insufficient privileges");

      await ZenoPayUser.deleteOne({ Email: "regular@user.com" });
    });
  });

  describe("POST /admin/forgot-password", () => {
    it("should send reset link for valid email", async () => {
      const response = await request(app)
        .post("/admin/forgot-password")
        .send({ email: "authtest@admin.com" })
        .expect(200);

      expect(response.text).toContain("reset link has been sent");
    });

    it("should handle non-existent email gracefully", async () => {
      const response = await request(app)
        .post("/admin/forgot-password")
        .send({ email: "nonexistent@admin.com" })
        .expect(200);

      // For security, don't reveal if email exists
      expect(response.text).toContain("reset link has been sent");
    });
  });

  describe("GET /admin/logout", () => {
    it("should logout and redirect to login", async () => {
      const response = await request(app)
        .get("/admin/logout")
        .expect(302);

      expect(response.header.location).toBe("/admin/login");
    });
  });
});
