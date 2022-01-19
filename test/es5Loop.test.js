import { run } from "../src/vm";

describe("es5 loop", () => {
  // for 循环
  test("for loop: basic", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        result += 2;
      }
      module.exports = result;`)
    ).toBe(10);
  });

  // for 循环 break
  test("for loop: break", () => {
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
  test("for loop: continue", () => {
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
  test("for loop: return", () => {
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
  // switch case
  test("switch", () => {
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

  // forIn block内声明的临时变量i
  test("forIn let", () => {
    expect(
      run(`var a = 'qwerty';var result = ''
      for (let i in a) {
        console.log(a[i])
        result += a[i]
      }
      module.exports = result;`)
    ).toBe("qwerty");
  });
  // forIn block外声明的变量i
  test("forIn out var", () => {
    expect(
      run(`var a = 'qwerty';var result = ''; var i
      for (i in a) {
        console.log(a[i])
        result += a[i]
      }
      module.exports = i;`)
    ).toBe("5");
  });
  // forIn 对象和内部声明的const i、
  test("forIn Object & const", () => {
    expect(
      run(`var a = {aa: 11, bb: 12, cc: 13};var result = 0;
      for (const i in a) {
        console.log(a[i])
        result += a[i]
      }
      module.exports = result;`)
    ).toBe(36);
  });
  // forIn Array
  test("forIn Array", () => {
    expect(
      run(`var a  = [10,9,8,7];var result = 0;
      for (const i in a) {
        result += a[i]
      }
      module.exports = result;`)
    ).toBe(34);
  });
});
