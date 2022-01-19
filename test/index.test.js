import { run } from "../src/vm";

describe("ji es5 VariableDeclaration", () => {
  // test("ArrowFunctionExpression", () => {
  //   expect(
  //     run(`var result = 0;
  //     const a = () => {
  //       for (var i = 0; i < 5; i++) {
  //         result += 2;
  //         return;
  //       }
  //     }
  //     a();
  //     module.exports = result;`)
  //   ).toBe(2);
  // });

  test("dev test", () => {
    expect(run("")).toBe(undefined);
  });

  // forOf object
  // test("forIn Identifier", () => {
  //   expect(
  //     run(`var a = {aa: 11, bb: 12, cc: 13};var result = 0;
  //     for (const i in a) {
  //       result += a[i]
  //     }
  //     module.exports = result;`)
  //   ).toBe(36);
  // });
});
