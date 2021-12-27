import { run } from "../src/vm";

describe("ji es5 BinaryExpressionign", () => {
  /**
   * 二元运算符
   */
  test("BinaryExpressionign: + ", () => {
    expect(run(`module.exports=3 + 4`)).toBe(7);
  });
  test("BinaryExpressionign: - ", () => {
    expect(run(`module.exports=4-1`)).toBe(3);
  });
  test("BinaryExpressionign: * ", () => {
    expect(run(`module.exports=4 * 2`)).toBe(8);
  });
  test("BinaryExpressionign: / ", () => {
    expect(run(`module.exports= 10 /3`)).toBe(10/3);
  });
  test("BinaryExpressionign: % ", () => {
    expect(run(`module.exports= 10 %3`)).toBe(1);
  });
  test("BinaryExpressionign: ** ", () => {
    expect(run(`module.exports= 3**2`)).toBe(9);
  });
  
  
  test("BinaryExpressionign: == ", () => {
    expect(run(`module.exports= 1 == true`)).toBe(true);
  });
  test("BinaryExpressionign: != ", () => {
    expect(run(`module.exports= '' != true`)).toBe(true);
  });
  test("BinaryExpressionign: === ", () => {
    expect(run(`module.exports=  1===1`)).toBe(true);
  });
  test("BinaryExpressionign: !== ", () => {
    expect(run(`module.exports=  1!==true`)).toBe(true);
  });

  test("BinaryExpressionign: < ", () => {
    expect(run(`module.exports=  1 <2`)).toBe(true);
  });
  test("BinaryExpressionign: >= ", () => {
    expect(run(`module.exports= 10 >=3`)).toBe(true);
  });
  test("BinaryExpressionign: > ", () => {
    expect(run(`module.exports=  2>1`)).toBe(true);
  });


  test("BinaryExpressionign: >> ", () => {
    expect(run(`module.exports=  8>>1`)).toBe(4);
  });
  test("BinaryExpressionign: << ", () => {
    expect(run(`module.exports=  2<<2`)).toBe(8);
  });
  test("BinaryExpressionign: | ", () => {
    expect(run(`module.exports= 4|1`)).toBe(5);
  });
});
