import type { Linter } from "eslint";
import { eslintOutputToIssue } from "./eslintOutputToIssue";

function getEslintPath() {
    const workspaceConf = nova.workspace.config.get(
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

export function runEslint(
    content: string,
    uri: string,
    // eslint-disable-next-line no-unused-vars
    callback: (issues: Array<Issue>) => void
) {
    if (!exlintExecutableIsGood()) {
        return;
    }

    if (!nova.workspace.path) {
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

    // TODO: Improve readable stream types
    const writer = (process.stdin as any).getWriter();
    writer.ready.then(() => {
        writer.write(content);
        writer.close();
    });

    return process;

    function handleOutput(output: string) {
        const parsedOutput = JSON.parse(output);
        const offenses = parsedOutput[0]["messages"] as Array<
            Linter.LintMessage
        >;

        callback(offenses.map(eslintOutputToIssue));
    }
}

export function fixEslint(path: string, callback: () => void) {
    if (!exlintExecutableIsGood()) {
        return;
    }

    if (!nova.workspace.path) {
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

function handleError(error: unknown) {
    console.error(error);
}
