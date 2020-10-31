import type { Linter } from "./linter";
import type { Rule } from "eslint";

export async function showChoicePalette<T>(
  choices: T[],
  // eslint-disable-next-line no-unused-vars
  choiceToString: (choice: T) => string,
  options?: { placeholder?: string }
) {
  const index = await new Promise<number | null>((resolve) =>
    nova.workspace.showChoicePalette(
      choices.map(choiceToString),
      options,
      (_, index) => {
        resolve(index);
      }
    )
  );
  if (index == null) {
    return null;
  }
  return choices[index];
}

type FixChoiceType = { fix: Rule.Fix } | { fixAll: true };
function isFixAll(x: FixChoiceType): x is { fixAll: true } {
  return !!(x as { fixAll: true }).fixAll;
}

export function createSuggestionCommandHandler(linter: Linter) {
  return async (editor: TextEditor) => {
    const choices: Array<
      { title: string } & ({ fix: Rule.Fix; clear(): void } | { fixAll: true })
    > = [];
    const messages = linter.interactWithMessagesAtSelection(editor);

    // preferred action: apply suggested fix
    for (const { message, clear } of messages) {
      if (message.fix) {
        choices.push({
          title: `Fix this ${message.ruleId} problem`,
          fix: message.fix,
          clear,
        });
      }
    }

    // all other secondary suggestions
    for (const { message, clear } of messages) {
      if (message.suggestions) {
        choices.push(
          ...message.suggestions.map((suggestion) => ({
            title: suggestion.desc,
            fix: suggestion.fix,
            clear,
          }))
        );
      }
    }

    // add ignore rule comment suggestion
    for (const { message, clear } of messages) {
      const linesRange = editor.getLineRangeForRange(editor.selectedRange);
      let alreadyHasPrecedingIgnoreComment = false;
      if (linesRange.start > 0) {
        const priorLineRange = editor.getLineRangeForRange(
          new Range(linesRange.start - 1, linesRange.start - 1)
        );
        const priorLine = editor.getTextInRange(priorLineRange);
        if (priorLine.match(/eslint-disable-next-line/)) {
          alreadyHasPrecedingIgnoreComment = true;
          choices.push({
            title: `Disable ${message.ruleId} for this line`,
            fix: {
              text: `${priorLine.trimRight()}, ${message.ruleId}\n`,
              range: [priorLineRange.start, priorLineRange.end],
            },
            clear,
          });
        }
      }
      if (!alreadyHasPrecedingIgnoreComment) {
        const linesForSelected = editor.getTextInRange(linesRange);
        const leadingWhitespace = linesForSelected.match(/^\s*/)![0];
        choices.push({
          title: `Disable ${message.ruleId} for this line`,
          fix: {
            text: `${leadingWhitespace}// eslint-disable-next-line ${message.ruleId}\n${linesForSelected}`,
            range: [linesRange.start, linesRange.end],
          },
          clear,
        });
      }
    }

    // fix everything
    choices.push({ title: "Fix all auto-fixable problems", fixAll: true });

    const choice = await showChoicePalette(choices, ({ title }) => title, {
      placeholder: "Choose an action",
    });
    if (!choice) {
      return;
    }
    if (isFixAll(choice)) {
      nova.commands.invoke("apexskier.eslint.command.fix", editor);
    } else {
      const { fix, clear } = choice;
      const [start, end] = fix.range;
      const range = new Range(start, end);
      const originalSelection = editor.selectedRange;
      clear();
      await editor.edit((edit) => {
        edit.replace(range, fix.text);
      });
      // put the cursor back where it was
      const rangeDiff = fix.text.length - range.length;
      editor.selectedRange = new Range(
        originalSelection.start + rangeDiff,
        originalSelection.end + rangeDiff
      );
    }
  };
}
