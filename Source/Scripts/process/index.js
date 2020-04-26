console.log(__filename);
console.log(process.env);

console.log(process.argv);

import Webpack from "webpack";
import StackTrace from "stacktrace-js";

import webpackConfig from "./webpackConfig";

const compiler = Webpack(webpackConfig);

const watcher = compiler.watch({}, function (err, stats) {
  const issues = [];
  if (err) {
    issues.push({ type: "error", message: err });
  }
  issues.push(
    ...stats.compilation.errors.map((error) => ({
      type: "error",
      file: error.module.resource,
      message: error.message,
    }))
  );
  issues.push(
    ...stats.compilation.warnings.map((error) => ({
      type: "warning",
      file: error.module.resource,
      message: error.message,
    }))
  );
  let test = StackTrace.fromError(stats.compilation.errors[0]);
  console.log(JSON.stringify({ type: "issues", issues }));
});

// TODO: invalidate watcher when files change? (might not be necessary)
// watcher.invalidate();
