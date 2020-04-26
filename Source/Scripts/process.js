import { eslintOutputToIssue } from "./offense";

export function runEslint(content, uri, callback, foo) {
  console.log(`starting process`);
  
  const process = new Process("/usr/bin/env", {
    args: [
      `${nova.workspace.path}/node_modules/.bin/eslint`,
      "--format=json",
      "--stdin",
      "--stdin-filename",
      uri,
    ],
    cwd: nova.workspace.path,
    stdio: "pipe",
  });

  process.onStdout(handleOutput);
  process.onStderr(handleError);

  process.start();

  console.log(`started process ${process.pid}`);

  const writer = process.stdin.getWriter();
  writer.ready.then(() => {
    writer.write(content);
    writer.close();
  });

  function handleError(error) {
    console.error(error);
  }

  function handleOutput(output) {
    const parsedOutput = JSON.parse(output);
    const offenses = parsedOutput[0]["messages"];

    console.log(output);

    callback(offenses.map(eslintOutputToIssue));
  }
}
