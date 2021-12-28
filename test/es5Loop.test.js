import { run } from "../src/vm";

describe("es5 loop", () => {
  // for 循环
  test("for loop", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        result += 2;
      }
      module.exports = result;`)
    ).toBe(10);
  });

  // for 循环 break
  test("for loop", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        result += 2;
        break;
      }
      module.exports = result;`)
    ).toBe(2);
  });

  // for 循环 continue
  test("for loop", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        if (result > 5) {
          continue;
        }
        result += 2;
      }
      module.exports = result;`)
    ).toBe(6);
  });
  // for 循环 return
  test("for loop", () => {
    expect(
      run(`var result = 0;
      function a() {
        for (var i = 0; i < 5; i++) {
          result += 2;
          return;
        }
      }
      a();
      module.exports = result;`)
    ).toBe(2);
  });
});
