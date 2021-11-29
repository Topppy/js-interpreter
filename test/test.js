import { run } from "../src/vm";

describe("ji es5", () => {
  test("BinaryExpressionign", () => {
    expect(
      run(`module.exports=3 + 4`)
    ).toBe(7);
  });
  // test("VariableDeclaration", () => {
  //   expect(
  //     run(`var age = 2`)
  //   ).toBe(7);
  // });
})