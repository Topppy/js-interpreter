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

  test("ArrowFunctionExpression", () => {
    expect(
      run(`var result = 0;
      function aa (a) {
        var re = 0
        switch (a) {
          case 1: 
              re = 100
              break;
          case 2: {
              re = 200
          }
          default:
            re = 10
            break;
        }
        return re
      }
    result = aa(1)
    module.exports = result;`)
    ).toBe(100);
  });
});
