import type { Linter } from "./linter";

jest.mock("./process");

(nova as any).path = {
  normalize: (s: string) => s,
};
(nova as any).config = {
  onDidChange: jest.fn(),
};
(nova as any).workspace = {
  config: {
    onDidChange: jest.fn(),
  },
};

(global as any).IssueCollection = jest.fn();
(global as any).Range = jest.fn();

(global as any).IssueSeverity = {
  Info: "info",
  Warning: "warning",
  Error: "error",
};

(global as any).Issue = jest.fn();

beforeEach(() => {
  (nova.config.onDidChange as jest.Mock).mockReset();
  (IssueCollection as jest.Mock).mockReset().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  }));
  (Range as jest.Mock).mockReset().mockImplementation((start, end) => ({
    start,
    end,
    length: end - start,
    compare: () => 1,
  }));
  (Issue as jest.Mock).mockReset();
  const { runLintPass, runFixPass } = require("./process");
  runLintPass.mockReset();
  runFixPass.mockReset();
});

describe("Linter", () => {
  test("lintDocument through interactWithMessagesAtSelection", () => {
    const { Linter } = require("./linter");
    const { runLintPass } = require("./process");

    const linter = new Linter() as Linter;

    const mockTextDocument: TextDocument = {
      uri: "mock://mockdocument1",
      getTextInRange() {
        return "";
      },
      syntax: Symbol("syntax"),
      eol: "\n",
    } as unknown as TextDocument;

    linter.lintDocument(mockTextDocument);

    expect(IssueCollection).toBeCalledTimes(1);
    const issueCollection = (IssueCollection as jest.Mock<IssueCollection>).mock
      .results[0].value as IssueCollection;

    expect(runLintPass).toBeCalledTimes(1);
    expect(runLintPass).toHaveBeenNthCalledWith(
      1,
      "",
      mockTextDocument.uri,
      mockTextDocument.syntax,
      expect.any(Function)
    );

    const resultsHandler = (runLintPass as jest.Mock).mock.calls[0][3];

    const ruleId = Symbol("ruleId");
    resultsHandler([
      {
        filePath: mockTextDocument.uri,
        messages: [
          {
            column: 10,
            line: 11,
            ruleId: ruleId,
            message: "Lint message",
            severity: 1,
            // fix?: Rule.Fix;
            // suggestions?: LintSuggestion[];
          },
        ],
      },
    ]);

    expect(issueCollection.set).toBeCalledTimes(1);
    expect(issueCollection.set).toHaveBeenNthCalledWith(
      1,
      mockTextDocument.uri,
      [
        {
          code: ruleId,
          column: 10,
          line: 11,
          message: "Lint message",
          severity: IssueSeverity.Warning,
          source: "ESLint",
        },
      ]
    );
    (issueCollection.get as jest.Mock).mockImplementationOnce(() => [
      {
        column: 10,
        line: 11,
      },
    ]);

    const mockEditor: TextEditor = {
      document: mockTextDocument,
      selectedRange: new Range(4, 5),
    } as unknown as TextEditor;
    (mockEditor.selectedRange.intersectsRange as any) = jest
      .fn()
      .mockImplementationOnce(() => true);
    const messages = linter.interactWithMessagesAtSelection(mockEditor);

    expect(issueCollection.get).toBeCalledTimes(1);
    expect(issueCollection.get).toHaveBeenNthCalledWith(
      1,
      mockTextDocument.uri
    );

    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "clear": [Function],
          "message": Object {
            "column": 10,
            "line": 11,
            "message": "Lint message",
            "ruleId": Symbol(ruleId),
            "severity": 1,
          },
        },
      ]
    `);

    (issueCollection.get as jest.Mock).mockImplementationOnce(() => [
      {
        column: 10,
        line: 11,
      },
    ]);
    messages[0].clear();
    expect(issueCollection.set).toBeCalledTimes(2);
    expect(issueCollection.set).toHaveBeenNthCalledWith(
      2,
      mockTextDocument.uri,
      []
    );
  });

  test("removeIssues", () => {
    const { Linter } = require("./linter");

    const linter = new Linter() as Linter;

    const issueCollection = (IssueCollection as jest.Mock<IssueCollection>).mock
      .results[0].value as IssueCollection;

    const mockTextDocument: TextDocument = {
      uri: "mock://mockdocument2",
    } as unknown as TextDocument;

    linter.removeIssues(mockTextDocument.uri);

    expect(issueCollection.remove).toBeCalledTimes(1);
    expect(issueCollection.remove).nthCalledWith(1, mockTextDocument.uri);
  });

  test("fixEditor", async () => {
    const { Linter } = require("./linter");
    const { runLintPass, runFixPass } = require("./process");

    const linter = new Linter() as Linter;

    const mockTextDocument: TextDocument = {
      uri: "mock://mockdocument3",
      getTextInRange() {
        return "";
      },
      syntax: Symbol("syntax"),
      eol: "\n",
      path: "/path/to/mock",
    } as unknown as TextDocument;

    linter.lintDocument(mockTextDocument);
    const resultsHandler = (runLintPass as jest.Mock).mock.calls[0][3];
    const ruleId = Symbol("ruleId");
    resultsHandler([
      {
        filePath: mockTextDocument.uri,
        messages: [
          {
            column: 10,
            line: 11,
            ruleId: ruleId,
            message: "Lint message",
            severity: 1,
            fix: {
              range: [43, 44],
              text: "fix_text",
            },
          },
          {
            column: 20,
            line: 21,
            ruleId: ruleId,
            message: "Lint message 2",
            severity: 2,
            fix: {
              range: [53, 54],
              text: "fix_text_2",
            },
          },
        ],
      },
    ]);

    const issueCollection = (IssueCollection as jest.Mock<IssueCollection>).mock
      .results[0].value as IssueCollection;
    (issueCollection.get as jest.Mock).mockImplementationOnce(() => [
      {
        column: 10,
        line: 11,
      },
      {
        column: 21,
        line: 22,
      },
    ]);

    let resolveEdit: () => void = () => {};
    const onDidSaveDispose = jest.fn();
    const mockEditor: TextEditor = {
      document: mockTextDocument,
      edit: jest.fn(
        () =>
          new Promise<void>((r) => {
            resolveEdit = r;
          })
      ),
      onDidSave: jest.fn(() => ({ dispose: onDidSaveDispose })),
      save: jest.fn(),
    } as unknown as TextEditor;

    const fixPromise = linter.fixEditor(mockEditor);

    expect(mockEditor.edit).toBeCalledTimes(1);
    const editFn = (mockEditor.edit as jest.Mock).mock.calls[0][0];
    const editObj = { replace: jest.fn() };
    editFn(editObj);
    resolveEdit();

    expect(editObj.replace).toBeCalledTimes(2);
    expect(editObj.replace).nthCalledWith(
      1,
      {
        compare: expect.any(Function),
        start: 43,
        end: 44,
        length: 1,
      },
      "fix_text"
    );
    expect(editObj.replace).nthCalledWith(
      2,
      {
        compare: expect.any(Function),
        start: 60,
        end: 61,
        length: 1,
      },
      "fix_text_2"
    );

    await fixPromise;

    expect(issueCollection.set).toBeCalledTimes(2);
    expect(issueCollection.set).nthCalledWith(2, mockTextDocument.uri, []);

    expect(mockEditor.onDidSave).toBeCalledTimes(1);
    expect(mockEditor.save).toBeCalledTimes(1);

    const didSaveCB = (mockEditor.onDidSave as jest.Mock).mock.calls[0][0];
    didSaveCB();

    expect(onDidSaveDispose).toBeCalledTimes(1);
    expect(runFixPass).toBeCalledTimes(1);
    expect(runFixPass).toBeCalledWith(
      mockTextDocument.uri,
      mockTextDocument.syntax,
      expect.any(Function)
    );
  });
});
