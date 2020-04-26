export function activate() {
  console.log("activating...");
  console.log(nova.workspace.path);

  nova.commands.register("apexskier.webpack.run", (editor) => {
    nova.workspace.showFileChooser(
      "Choose your webpack configuration file.",
      {
        allowFiles: true,
        allowDirectories: false,
        allowMultiple: false,
        relative: false,
      },
      (files) => {
        if (!files || !files.length) {
          return;
        }

        // TODO: limit 1 process per workspace.
        // I'd like this to be a task
        const args = nova.config.get("apexskier.webpack.debug", "Boolean")
          ? [
              "node",
              "--inspect",
              `${nova.extension.path}/Scripts/process.dist.js`,
            ]
          : ["node", `${nova.extension.path}/Scripts/process.dist.js`];
        const process = new Process("/usr/bin/env", {
          args,
          env: {
            NODE_PATH: `${nova.workspace.path}/node_modules`,
            WEBPACK_CONFIG: files[0],
          },
          cwd: nova.workspace.path,
          stdio: "pipe",
        });

        const issues = new IssueCollection();

        process.onStdout((message) => {
          try {
            let obj;
            try {
              obj = JSON.parse(message);
            } catch (err) {
              return;
            }
            console.log(message);
            switch (obj.type) {
              case "issues":
                console.log(obj.issues.length);
                issues.clear();
                for (const issue of obj.issues) {
                  const novaIssue = new Issue(); // rollup doesn't scope this right
                  // novaIssue.source = ;
                  novaIssue.message = issue.message;
                  novaIssue.severity = (() => {
                    switch (issue.type) {
                      case "warning":
                        return IssueSeverity.Warning;
                      case "error":
                      default:
                        return IssueSeverity.Error;
                    }
                  })();
                  novaIssue.line = 1;
                  novaIssue.column = 1;
                  novaIssue.endLine = 1;
                  novaIssue.endColumn = 3;
                  console.log(issue.file);
                  issues.set(issue.file, [novaIssue]);
                }
                break;
            }
          } catch (err) {
            console.error(err);
          }
        });
        process.onStderr((message) => {
          console.error(message);
        });

        process.start();
        console.log("started sub-process", process.pid);
      }
    );
  });
}
