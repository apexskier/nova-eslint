import { eslintOutputToIssue } from "./eslintOutputToIssue";

function getEslintPath() {
    let workspaceConf = nova.workspace.config.get(
        "apexskier.eslint.config.eslintPath",
        "string"
    );
    if (workspaceConf) {
        return workspaceConf;
    }

    const globalConf = nova.config.get(
        "apexskier.eslint.config.eslintPath",
        "string"
    );
    if (globalConf) {
        return globalConf;
    }

    return `${nova.workspace.path}/node_modules/.bin/eslint`;
}

function exlintExecutableIsGood() {
    const stat = nova.fs.stat(eslintPath);
    return stat && (stat.isFile() || stat.isSymbolicLink());
}

let eslintPath = getEslintPath();
nova.config.onDidChange("apexskier.eslint.config.eslintPath", () => {
    eslintPath = getEslintPath();
    console.log("Updating ESLint executable globally", eslintPath);
});
nova.workspace.config.onDidChange("apexskier.eslint.config.eslintPath", () => {
    eslintPath = getEslintPath();
    console.log("Updating ESLint executable for workspace", eslintPath);
});

export function runEslint(content, uri, callback) {
    if (!exlintExecutableIsGood()) {
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
    if (!exlintExecutableIsGood()) {
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
