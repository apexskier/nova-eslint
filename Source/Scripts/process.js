import { eslintOutputToIssue } from "./offense";

let eslintPath = `${nova.workspace.path}/node_modules/.bin/eslint`;
nova.workspace.config.onDidChange("apexskier.eslint.eslintPath", (newValue) => {
  eslintPath = newValue || `${nova.workspace.path}/node_modules/.bin/eslint`;
});

export function runEslint(content, uri, callback) {
  let stat = nova.fs.stat(eslintPath)
  if (!stat.isFile() && !stat.isSymbolicLink()) {
    return;
  }

  const process = new Process("/usr/bin/env", {
    args: [eslintPath, "--format=json", "--stdin", "--stdin-filename", uri],
    cwd: nova.workspace.path,
    stdio: "pipe",
  });

  process.onStdout(handleOutput);
  process.onStderr(handleError);

  process.start();

  const writer = process.stdin.getWriter();
  writer.ready.then(() => {
    writer.write(content);
    writer.close();
  });

  return process;

  function handleOutput(output) {
    const parsedOutput = JSON.parse(output);
    const offenses = parsedOutput[0]["messages"];

    callback(offenses.map(eslintOutputToIssue));
  }
}

export function fixEslint(path, callback) {
  let stat = nova.fs.stat(eslintPath)
  if (!stat.isFile() && !stat.isSymbolicLink()) {
    return;
  }

  const process = new Process("/usr/bin/env", {
    args: [eslintPath, "--fix", "--format=json", path],
    cwd: nova.workspace.path,
    stdio: "pipe",
  });

  process.onStderr(handleError);
  process.onDidExit(() => {
    callback();
  });

  process.start();
  
  return process;
}

function handleError(error) {
  console.error(error);
}
