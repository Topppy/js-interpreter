import { run } from "../src/vm";
// import './es5BinaryExp.test'

describe("ji es5 VariableDeclaration", () => {
  // 变量声明
  test("VariableDeclaration", () => {
    expect(
      run(`var age = 2; const age2 = 4; module.exports = age + age2`)
    ).toBe(6);
  }); 
  // 变量声明
  test("for loop", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        result += 2;
      }
      module.exports = result;`)
    ).toBe(6);
  });
});
