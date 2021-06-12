import * as path from "path";
import { getEslintPath } from "./getEslintPath";

const ProcessMock: jest.Mock<Partial<Process>> = jest.fn();
(global as any).Process = ProcessMock;
(global as any).nova = Object.assign(nova, {
  config: { get: jest.fn() },
  workspace: { config: { get: jest.fn() }, showErrorMessage: jest.fn() },
  path: {
    isAbsolute: path.isAbsolute,
    join: path.join,
  },
  fs: {
    access: jest.fn(),
    X_OK: Symbol("X_OK"),
  },
  extension: {
    path: "/extension/path",
  },
});

describe("getEslintPath", () => {
  ProcessMock.mockImplementation(() => ({
    onStdout: jest.fn((cb) => {
      cb("/path/to/npmbin\n");
      return { dispose: jest.fn() };
    }),
    onStderr: jest.fn(),
    onDidExit: jest.fn((cb) => {
      cb(0);
      return { dispose: jest.fn() };
    }),
    start: jest.fn(),
  }));

  beforeEach(() => {
    (nova.config.get as jest.Mock).mockReset();
    delete (nova.workspace as any).path;
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.fs.access as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => true);
  });

  it("defaults to the normal location within npm's bin directory", async () => {
    expect(await getEslintPath()).toBe("/path/to/npmbin/eslint");
  });

  it("can be overridden globally", async () => {
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/global/path");
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => undefined
    );
    expect(await getEslintPath()).toBe("/global/path");
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintPath",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(1);
    expect(nova.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintPath",
      "string"
    );
  });

  it("can be overridden in the workspace", async () => {
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "/workspace/path"
    );
    expect(await getEslintPath()).toBe("/workspace/path");
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintPath",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(0);
  });

  it("can be overridden relatively", async () => {
    (nova.workspace as any).path = "/workspace";
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "./rel/ws/path"
    );
    expect(await getEslintPath()).toBe("/workspace/rel/ws/path");
    expect(nova.workspace.config.get).toBeCalledTimes(1);
    expect(nova.workspace.config.get).toHaveBeenNthCalledWith(
      1,
      "apexskier.eslint.config.eslintPath",
      "string"
    );
    expect(nova.config.get).toBeCalledTimes(0);
  });

  test("workspace relative paths not allowed without a workspace path", async () => {
    (nova.config.get as jest.Mock).mockImplementationOnce(() => []);
    (nova.workspace.config.get as jest.Mock).mockImplementationOnce(
      () => "rel"
    );
    expect(await getEslintPath()).toBeNull();
    expect(nova.workspace.showErrorMessage).toBeCalledTimes(1);
  });

  it("detects non-executable paths", async () => {
    (nova.fs.access as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => false);
    (nova.config.get as jest.Mock).mockImplementationOnce(() => "/global/path");
    expect(await getEslintPath()).toBe(null);
    expect(nova.fs.access).toBeCalledTimes(1);
    expect(nova.fs.access).toHaveBeenNthCalledWith(
      1,
      "/global/path",
      nova.fs.X_OK
    );
  });
});
