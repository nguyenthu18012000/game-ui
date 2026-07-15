import { describe, expect, it } from "vitest";
import { extractTokens } from "../../src/services/AuthService";

describe("extractTokens", () => {
  it("extracts tokens from an API envelope", () => {
    expect(
      extractTokens({
        code: 200,
        data: { accessToken: "access", refreshToken: "refresh" },
      }),
    ).toEqual({ accessToken: "access", refreshToken: "refresh" });
  });

  it("supports a flat response and snake_case fields", () => {
    expect(extractTokens({ access_token: "access", refresh_token: "refresh" })).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
    });
  });

  it("keeps the previous refresh token when rotation is not used", () => {
    expect(extractTokens({ data: { accessToken: "new-access" } }, "old-refresh")).toEqual({
      accessToken: "new-access",
      refreshToken: "old-refresh",
    });
  });

  it("rejects a response without an access token", () => {
    expect(() => extractTokens({ data: {} })).toThrow(/Access token/);
  });
});
