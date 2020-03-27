const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

module.exports = {
    input: "Source/Scripts/main.js",
    plugins: [
        commonjs(),
        resolve()
    ],
    output: {
        file: "ESLint.novaextension/Scripts/main.dist.js",
        format: "cjs"
    }
};
