import { run } from "../src/vm";

describe("ji es5 VariableDeclaration", () => {
  test("dev test", () => {
    expect(run('')).toBe(undefined);
  });

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
  // for block内声明的临时变量i
});
