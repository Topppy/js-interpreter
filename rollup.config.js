import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: ["src/vm.ts"],
  output: {
    file: "dist/ji.js",
    format: "umd",
    name: "ji",
  },
  plugins: [
    typescript(),
    resolve({
      preferBuiltins: false,
    }),
    commonjs({ extensions: [".js", ".ts"] }),
  ],
};

export default config;