const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

export default {
  input: "Source/Scripts/process/index.js",
  plugins: [
    commonjs({
      exclude: ["Source/Scripts/process/webpackConfig.js"],
    }),
    resolve(),
  ],
  output: {
    file: "webpack.novaextension/Scripts/process.dist.js",
    sourcemap: true,
    format: "cjs",
  },
  external: ["webpack"],
};
