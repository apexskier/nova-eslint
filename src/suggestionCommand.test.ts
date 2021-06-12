import type { Linter as ESLintLinter } from "eslint";
import type { Linter } from "./linter";
import { createSuggestionCommandHandler } from "./suggestionCommand";

(global as any).nova = Object.assign(nova, {
  commands: {
    invoke: jest.fn(),
  },
  workspace: {},
});

class MockRange {
  // eslint-disable-next-line no-unused-vars
  constructor(readonly start: number, readonly end: number) {}
}
(global as any).Range = MockRange;

describe("suggestion command", () => {
  const lintMessages: ReadonlyArray<{
    message: ESLintLinter.LintMessage;
    clear(): void;
  }> = [
    {
      message: {
        column: 4,
        line: 5,
        ruleId: "rule_id_0",
        message: "message 1",
        severity: 1,
      },
      clear: jest.fn(),
    },
    {
      message: {
        column: 4,
        line: 5,
        ruleId: "rule_id_1",
        message: "message 0",
        messageId: "message_id_0",
        severity: 1,
        fix: {
          range: [10, 20],
          text: "fix text",
        },
        suggestions: [],
      },
      clear: jest.fn(),
    },
  ];
  const mockLinter: Partial<Linter> = {
    interactWithMessagesAtSelection: jest.fn(() => lintMessages),
  };

  const command = createSuggestionCommandHandler(
    mockLinter as unknown as Linter
  );

  beforeEach(() => {
    lintMessages.forEach(({ clear }) => (clear as jest.Mock).mockReset());
    (nova.commands.invoke as jest.Mock).mockReset();
  });

  test("fix the first fixable problem", async () => {
    nova.workspace.showChoicePalette = jest.fn((choices, _, callback) => {
      callback?.(null, 0);
    });

    const mockEditor: Partial<TextEditor> = {
      selectedRange: {
        start: 6,
        end: 6,
      } as Range,
      getLineRangeForRange(range: Range): Range {
        return range;
      },
      getTextInRange() {
        return "text in range";
      },
      edit: jest.fn(async () => {}),
    };

    const promise = command(mockEditor as unknown as TextEditor);

    expect(nova.workspace.showChoicePalette).toBeCalledTimes(1);
    expect(nova.workspace.showChoicePalette).toHaveBeenNthCalledWith(
      1,
      [
        "Fix this rule_id_1 problem",
        "Disable rule_id_0 for this line",
        "Disable rule_id_1 for this line",
        "Fix all auto-fixable problems",
      ],
      { placeholder: "Choose an action" },
      expect.any(Function)
    );

    await promise;

    expect(nova.commands.invoke).toBeCalledTimes(0);

    expect(lintMessages[0].clear).toBeCalledTimes(0);
    expect(lintMessages[1].clear).toBeCalledTimes(1);

    expect(mockEditor.edit).toBeCalledTimes(1);
    const editCallback = (mockEditor.edit as jest.Mock).mock.calls[0][0];
    const replace = jest.fn();
    editCallback({ replace });
    expect(replace).toBeCalledTimes(1);
    expect(replace).toHaveBeenNthCalledWith(
      1,
      { end: 20, start: 10 },
      "fix text"
    );
  });

  test("fix all", async () => {
    nova.workspace.showChoicePalette = jest.fn((choices, _, callback) => {
      callback?.(null, choices.length - 1);
    });

    const mockEditor: Partial<TextEditor> = {
      selectedRange: {
        start: 6,
        end: 6,
      } as Range,
      getLineRangeForRange(range: Range): Range {
        return range;
      },
      getTextInRange() {
        return "text in range";
      },
      edit: jest.fn(async () => {}),
    };

    await command(mockEditor as unknown as TextEditor);

    expect(nova.commands.invoke).toBeCalledTimes(1);
    expect(nova.commands.invoke).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.command.fix",
      mockEditor
    );

    expect(lintMessages[1].clear).toBeCalledTimes(0);
    expect(mockEditor.edit).toBeCalledTimes(0);
  });

  test("disable lint comment", async () => {
    nova.workspace.showChoicePalette = jest.fn((choices, _, callback) => {
      callback?.(null, 1);
    });

    const mockEditor: Partial<TextEditor> = {
      selectedRange: {
        start: 6,
        end: 6,
      } as Range,
      getLineRangeForRange(range: Range): Range {
        return range;
      },
      getTextInRange() {
        return "text in range";
      },
      edit: jest.fn(async () => {}),
    };

    await command(mockEditor as unknown as TextEditor);

    expect(nova.commands.invoke).toBeCalledTimes(0);

    expect(mockEditor.edit).toBeCalledTimes(1);
    const editCallback = (mockEditor.edit as jest.Mock).mock.calls[0][0];
    const replace = jest.fn();
    editCallback({ replace });
    expect(replace).toBeCalledTimes(1);
    expect(replace).toHaveBeenNthCalledWith(
      1,
      { end: 6, start: 6 },
      `// eslint-disable-next-line rule_id_0
text in range`
    );
  });

  test("add to a disable lint comment", async () => {
    nova.workspace.showChoicePalette = jest.fn((choices, _, callback) => {
      callback?.(null, 1);
    });

    const mockEditor: Partial<TextEditor> = {
      selectedRange: {
        start: 6,
        end: 6,
      } as Range,
      getLineRangeForRange(): Range {
        return new Range(2, 8);
      },
      getTextInRange: jest.fn(() => "    // eslint-disable-next-line a-rule"),
      edit: jest.fn(async () => {}),
    };

    await command(mockEditor as unknown as TextEditor);

    expect(nova.commands.invoke).toBeCalledTimes(0);

    expect(mockEditor.getTextInRange).toBeCalledTimes(2);
    expect(mockEditor.getTextInRange).toHaveBeenNthCalledWith(1, {
      end: 8,
      start: 2,
    });
    expect(mockEditor.getTextInRange).toHaveBeenNthCalledWith(2, {
      end: 8,
      start: 2,
    });
    expect(mockEditor.edit).toBeCalledTimes(1);
    const editCallback = (mockEditor.edit as jest.Mock).mock.calls[0][0];
    const replace = jest.fn();
    editCallback({ replace });
    expect(replace).toBeCalledTimes(1);
    expect(replace).toHaveBeenNthCalledWith(
      1,
      { end: 8, start: 2 },
      "    // eslint-disable-next-line a-rule, rule_id_0\n"
    );
  });
});
