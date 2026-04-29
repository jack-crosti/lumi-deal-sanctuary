import { describe, expect, it } from "vitest";
import { getDashboardPathForEmail, getRoleForEmail } from "./authRoles";

describe("auth role routing", () => {
  it("routes jack@lumi.nz to admin", () => {
    expect(getRoleForEmail("jack@lumi.nz")).toBe("admin");
    expect(getRoleForEmail(" Jack@Lumi.nz ")).toBe("admin");
    expect(getDashboardPathForEmail("jack@lumi.nz")).toBe("/admin/dashboard");
  });

  it("routes every other signed-in email to buyer", () => {
    expect(getRoleForEmail("buyer@example.com")).toBe("buyer");
    expect(getDashboardPathForEmail("buyer@example.com")).toBe("/buyer/dashboard");
  });
});