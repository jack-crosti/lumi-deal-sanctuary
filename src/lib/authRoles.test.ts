import { describe, expect, it } from "vitest";
import { getDashboardPathForRole } from "./authRoles";

describe("auth role routing", () => {
  it("routes admin role to admin dashboard", () => {
    expect(getDashboardPathForRole("admin")).toBe("/admin/dashboard");
  });
  it("routes buyer or unknown role to buyer dashboard", () => {
    expect(getDashboardPathForRole("buyer")).toBe("/buyer/dashboard");
    expect(getDashboardPathForRole(null)).toBe("/buyer/dashboard");
  });
});