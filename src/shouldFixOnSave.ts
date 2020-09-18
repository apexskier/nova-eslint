function getWorkspaceSetting(): boolean | null {
    const str = nova.workspace.config.get(
        "apexskier.eslint.config.fixOnSave",
        "string"
    );
    switch (str) {
        case "Disable":
            return false;
        case "Enable":
            return true;
        default:
            return null;
    }
}

export function shouldFixOnSave(): boolean {
    return (
        getWorkspaceSetting() ??
        nova.config.get("apexskier.eslint.config.fixOnSave", "boolean") ??
        false
    );
}
