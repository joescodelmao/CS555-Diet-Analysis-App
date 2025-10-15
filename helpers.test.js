import { checkUsername } from "./helpers.js";

describe("checkUsername", () => {
  test("check that a username returns all lowercase", () => {
    expect(checkUsername("USERNAME123")).toBe("username123");
  });

  test("check that a username with an empty string throws an error", () => {
    expect(() => checkUsername("")).toThrow();
  });
});
