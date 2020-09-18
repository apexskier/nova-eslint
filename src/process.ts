import type { Linter } from "eslint";
import { eslintOutputToIssue } from "./eslintOutputToIssue";
import { getEslintPath } from "./getEslintPath";

let eslintPath: string | null = null;
nova.config.onDidChange("apexskier.eslint.config.eslintPath", async () => {
    eslintPath = await getEslintPath();
    console.log("Updating ESLint executable globally", eslintPath);
});
nova.workspace.config.onDidChange(
    "apexskier.eslint.config.eslintPath",
    async () => {
        eslintPath = await getEslintPath();
        console.log("Updating ESLint executable for workspace", eslintPath);
    }
);
(async () => {
    eslintPath = await getEslintPath();
})();

export function runEslint(
    content: string,
    uri: string,
    // eslint-disable-next-line no-unused-vars
    callback: (issues: Array<Issue>) => void
) {
    if (!nova.workspace.path || !eslintPath) {
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

export function fixEslint(path: string) {
    if (!nova.workspace.path || !eslintPath) {
        return;
    }

    const process = new Process("/usr/bin/env", {
        args: [eslintPath, "--fix", "--format=json", path],
        cwd: nova.workspace.path,
        stdio: "pipe",
    });

    process.onStderr(handleError);

    process.start();

    return process;
}

function handleError(error: unknown) {
    console.error(error);
}
