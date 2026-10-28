# Changelog

## 1.5.1 (2026-10-27)

- Updated `repository`, `homepage`, and `bugs` URLs to `https://github.com/nandoblanco/vscode-localhost-opener` and standardized `README.md`.

## 1.5.0

- Clicking the left Activity Bar globe icon launches the active file in the browser (`treeView.onDidChangeVisibility`) and switches the sidebar back to Explorer.
- Changed the top-right editor title bar button (`localhostOpener.openSplit`, `Ctrl+Alt+L`) to open VS Code's Integrated Browser (`workbench.action.browser.open` with `{ url, openToSide: true, reuseUrlFilter: url }`, falling back to `simpleBrowser.api.open`) in the side editor group at the mapped `http://localhost/...` URL with live reload on save (`isBrowserPreviewOpen` via `vscode.window.tabGroups`) and a split-globe icon (`media/split-globe-dark.svg` / `media/split-globe-light.svg`).
- Added `Localhost: Add Document Root (MAMP / XAMPP)` (`localhostOpener.addRoot`) with an OS folder picker and localhost URL prompt.
- Added an `Add Document Root...` action button on the unmapped-file warning notification and wired the sidebar fallback item to `localhostOpener.addRoot`.
- Added sidebar tree refresh when `localhostOpener.roots` changes in VS Code Settings.
- Documented MAMP and XAMPP prerequisites and default document root paths in `README.md`.

## 1.4.1 (2026-10-26)

- Fixed `panel.onDidDispose` cleanup handler when closing a live-reload split pane.
- Added Marketplace metadata (`icon`, `repository`, `license`, `keywords`, `author`), `README.md`, `CHANGELOG.md`, and MIT `LICENSE`.

## 1.4.0

- Added Explorer and Editor right-click context menu commands: `Open in Localhost (Browser)` (`localhostOpener.openFromExplorer`) and `Open in Localhost Split Pane (Live Reload)` (`localhostOpener.openSplitFromExplorer`).

## 1.3.0

- Added side-by-side split-pane preview (`localhostOpener.openSplit`, `Ctrl+Alt+L`) with live reload on save across any mapped file.

## 1.2.0

- Added keyboard shortcuts (`Ctrl+Alt+O` for browser launch, `Ctrl+Alt+L` for split pane) and `localhostOpener.browser` setting (`"system"` or `"simple"`).

## 1.1.0

- Added longest-prefix matching across multiple `{ path, url }` roots in `localhostOpener.roots` and `Localhost: Copy URL` inline action.

## 1.0.0

- Initial release with Activity Bar view and `Localhost: Open Active File` command.
