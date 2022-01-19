
import { run } from "../src/vm";

describe("ji context", () => {
  // 内置方法
  test("native console", () => {
    expect(() => run(`console.xx('hello world')`)).toThrow(
      "console.xx is undefined"
    );
    expect(() => run(`console.log('hello world')`)).not.toThrow(
      "console.log is undefined"
    );
  });

  // 外置方法
  test("inject Context", () => {
    expect(
      run(
        `var result =  a(4)
        module.exports = result;`,
        {
          a: (res) => {
            return res + 10;
          },
        }
      )
    ).toBe(14);
  });
});
