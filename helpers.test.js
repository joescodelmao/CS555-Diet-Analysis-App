import { checkUsername, checkForNoRestrictions } from "./helpers.js";

describe("checkUsername", () => {
  test("check that a username returns all lowercase", () => {
    expect(checkUsername("USERNAME123")).toBe("username123");
  });

  test("check that a username with an empty string throws an error", () => {
    expect(() => checkUsername("")).toThrow();
  });
});

describe("checkForNoRestrictions", () => {
  test("when there are no restrictions then this should return true", () => {
    expect(
      checkForNoRestrictions({
        vegan: false,
        vegetarian: false,
        pescatarian: false,
        gluten_free: false,
        dairy_free: false,
        nut_free: false,
        peanut_free: false,
        soy_free: false,
        egg_free: false,
        shellfish_free: false,
        halal: false,
        kosher: false,
        low_carb: false,
        low_sodium: false,
        low_sugar: false,
      })
    ).toBe(true);
  });

  test("when there are no restrictions then this should return true", () => {
    expect(
      checkForNoRestrictions({
        vegan: true,
        vegetarian: false,
        pescatarian: false,
        gluten_free: false,
        dairy_free: false,
        nut_free: false,
        peanut_free: true,
        soy_free: false,
        egg_free: true,
        shellfish_free: false,
        halal: false,
        kosher: true,
        low_carb: false,
        low_sodium: false,
        low_sugar: false,
      })
    ).toBe(false);
  });
});
