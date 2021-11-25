import { run } from "../src/vm";

describe("ji es5", () => {
  test("BinaryExpressionign", () => {
    expect(
      run(`1+2`)
    ).toBe(3);
  });
})