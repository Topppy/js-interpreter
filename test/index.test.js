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

  test("native console", () => {
    expect(() => run(`console.xx('hello world')`)).toThrow('console.xx is undefined');
    expect(() => run(`console.log('hello world')`)).not.toThrow('console.log is undefined');
  });
});
