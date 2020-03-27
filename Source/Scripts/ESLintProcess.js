// 
// ESLint Extension for Nova
// ESLintProcess.js
//
// Copyright © 2019-2020 Justin Mecham. All rights reserved.
// 

const { NPMExecutable } = require("nova-npm-executable");
const Offense = require("./Offense");

class ESLintProcess {

    constructor() {
        this.eslint = new NPMExecutable("eslint");
        if (!this.eslint.isInstalled) {
            console.log("hi")
            this.eslint.install().catch(error => console.error(error));
        }
    }

    async process(commandArguments) {
        const process = await this.eslint.process({
            args: commandArguments,
            cwd: nova.workspace.path,
            stdio: "pipe",
        }); 

        return process;
    }

    async execute(content, uri) {
        const defaultArguments = [
            "--format=json",
            "--stdin",
            "--stdin-filename",
            uri
        ];

        const process = await this.process(defaultArguments);
        if (!process) return;

        process.onStdout(this.handleOutput.bind(this));
        process.onStderr(this.handleError.bind(this));

        process.start();

        const writer = process.stdin.getWriter();
        writer.ready.then(() => {
            writer.write(content);
            writer.close();
        });
    }

    handleError(error) {
        console.error(error);
    }

    handleOutput(output) {
        const parsedOutput = JSON.parse(output);
        const offenses = parsedOutput[0]["messages"];

        // console.info(JSON.stringify(offenses, null, "    "));

        this.offenses = offenses.map(offense => new Offense(offense));

        if (this._onCompleteCallback) {
            this._onCompleteCallback(this.offenses);
        }
    }

    onComplete(callback) {
        this._onCompleteCallback = callback;
    }

}

module.exports = ESLintProcess;
