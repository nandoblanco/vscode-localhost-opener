# Localhost Opener

**Local web server URL mapper and live-reloading split preview extension for VS Code**: maps files inside your MAMP, XAMPP, WampServer, Laragon, or Apache/Nginx document root to their `http://localhost/...` URLs, launches them in your browser with one click from the Activity Bar, and opens a live-reloading preview pane beside your code.

## Background

When developing PHP sites, Cascade CMS templates, WordPress or Drupal builds, or Apache/Nginx projects locally, previewing the file you are editing in a browser has three recurring friction points:

1. **Manual path-to-URL translation**: Turning a filesystem path like `C:\MAMP\htdocs\client-site\includes\header.php` into `http://localhost/client-site/includes/header.php` means copying paths, stripping document root prefixes, and fixing backslashes by hand.
2. **Server-dependent rendering**: Built-in static preview servers only serve raw files over a temporary port. They print unexecuted `.php` source code, ignore `.htaccess` rewrites and virtual hosts, and break root-relative asset paths (`/assets/css/site.css`) whenever your VS Code workspace is a subfolder of the server root.
3. **Manual browser reloads across split windows**: Editing a stylesheet, script, or PHP partial requires switching focus to the browser and force-reloading past the HTTP heuristic cache after every save.

`localhost-opener` connects VS Code directly to the local web server you already run:

1. **Longest-prefix document root mapping**: Point the extension at your document root (`C:\xampp\htdocs`, `C:\MAMP\htdocs`, `/Applications/MAMP/htdocs`) once using the native folder picker, and `fileToUrl()` resolves any file inside that tree to its served `http://localhost/...` URL.
2. **One-click Activity Bar launch**: Clicking the Activity Bar globe opens the active file's localhost URL in your default browser and immediately returns the sidebar to Explorer.
3. **Cache-busting live reload in a split pane**: Clicking the split-globe icon in the editor title bar (`Ctrl+Alt+L`) opens VS Code's Integrated Browser beside your code and runs a hard reload (`workbench.action.browser.hardReload`) whenever you save any mapped file.

## Features

| Feature | Details |
| :--- | :--- |
| Document root folder picker (`addRoot`) | Run `Localhost: Add Document Root (MAMP / XAMPP)` to select your `htdocs` folder from a native OS dialog and set its base `http://localhost` URL. |
| Longest-prefix root matching (`fileToUrl`) | Maps file paths to `http://localhost/...` URLs using `{ path, url }` pairs. Nested project sub-roots automatically take precedence over parent server roots. |
| One-click Activity Bar browser launch | Clicking the left Activity Bar globe opens the active file in your browser and returns the sidebar to Explorer. |
| Split-globe integrated browser (`Ctrl+Alt+L`) | Clicking the split-globe icon in the top-right editor title bar opens VS Code's Integrated Browser (or Simple Browser fallback) beside your code at the mapped `http://localhost/...` URL. |
| Hard-reload on save (`trackSave`) | Saving any file under a configured root reloads the open split preview bypassing Chromium's HTTP cache, including when you save external `.css`, `.js`, or `.php` files. |
| System or integrated browser mode | Open URLs in your OS default browser (`"system"`) or inside VS Code's split preview pane (`"simple"`). |
| Explorer & editor context menus | Right-click any file in the Explorer sidebar or inside an editor tab to open it in your browser or in a live-reloading split pane. |

## Installation

### Option 1: Install from VSIX (Recommended)

```bash
code --install-extension localhost-opener-1.5.1.vsix
```

For VS Code Insiders:

```bash
code-insiders --install-extension localhost-opener-1.5.1.vsix
```

### Option 2: Package from Source

```bash
cd localhost-opener
npx @vscode/vsce package
code --install-extension localhost-opener-1.5.1.vsix
```

## Step-by-Step Setup

### Prerequisite: Local Web Server (MAMP or XAMPP)

Localhost Opener does not bundle a web server. Start MAMP, XAMPP, WampServer, Laragon, or your local Apache/Nginx instance before opening previews.

| Local Server | OS | Default Document Root | Default Base URL |
| :--- | :--- | :--- | :--- |
| XAMPP | Windows | `C:\xampp\htdocs` | `http://localhost` |
| MAMP | Windows | `C:\MAMP\htdocs` | `http://localhost` or `http://localhost:8888` |
| MAMP | macOS | `/Applications/MAMP/htdocs` | `http://localhost:8888` |
| XAMPP | macOS | `/Applications/XAMPP/htdocs` | `http://localhost` |
| WampServer | Windows | `C:\wamp64\www` | `http://localhost` |
| Laragon | Windows | `C:\laragon\www` | `http://localhost` |
| Apache | Linux | `/var/www/html` | `http://localhost` |

### Method 1: Interactive Folder Picker (Recommended)

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run `Localhost: Add Document Root (MAMP / XAMPP)`. You can also click `+` in the Open in Localhost sidebar header, or click **Add Document Root...** on the warning prompt when opening an unmapped file.
2. Select your document root folder in the OS folder dialog (`C:\xampp\htdocs`, `C:\MAMP\htdocs`, `/Applications/MAMP/htdocs`, etc.).
3. Enter the localhost base URL that serves that folder (`http://localhost`, or `http://localhost:8888` if MAMP uses port 8888) and press `Enter`.

### Method 2: Manual `settings.json` Configuration

Add `localhostOpener.roots` to your VS Code `settings.json` (`Ctrl+,` -> Open Settings JSON):

```json
{
  "localhostOpener.roots": [
    {
      "path": "C:\\xampp\\htdocs",
      "url": "http://localhost"
    },
    {
      "path": "C:\\MAMP\\htdocs\\custom-app\\public",
      "url": "http://localhost:8080"
    }
  ],
  "localhostOpener.browser": "system"
}
```

If you run multiple servers or project-specific ports, list all of them. `fileToUrl()` picks the longest matching path first, so a project subfolder overrides the top-level server root.

## Usage

### 1. One-Click Activity Bar Launch

Click the globe icon in the left Activity Bar (or press `Ctrl+Alt+O` / `Cmd+Alt+O`) while editing a mapped file to open its `http://localhost/...` URL in your browser. If the active file is outside your configured roots, the sidebar stays open and displays `No localhost root matches this file (click to add)` so you can register the folder in place.

### 2. Split-Pane Live Preview

Click the split-globe icon in the top-right corner of the editor tab bar (or press `Ctrl+Alt+L` / `Cmd+Alt+L`) to open a preview pane beside your code. Saving the active page or any mapped stylesheet, script, or PHP partial automatically hard-reloads the preview while keeping cursor focus in your editor.

### 3. Explorer & Editor Context Menus

Right-click any file in the Explorer file tree or inside an editor tab and select **Open in Localhost (Browser)** or **Open in Localhost Split Pane (Live Reload)** to launch a file without switching your active editor tab first.

## Commands & Shortcuts Reference

| Command | ID | Keybinding | UI Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Localhost: Add Document Root (MAMP / XAMPP)` | `localhostOpener.addRoot` | _(none)_ | Sidebar Header (`+`), Command Palette | Opens a folder picker and URL input box to add or update an entry in `localhostOpener.roots`. |
| `Localhost: Open Active File` | `localhostOpener.open` | `Ctrl+Alt+O` (`Cmd+Alt+O`) | Left Activity Bar Globe, Command Palette | Opens the active file's localhost URL in the configured browser. |
| `Localhost: Open in Split Pane (Live Reload)` | `localhostOpener.openSplit` | `Ctrl+Alt+L` (`Cmd+Alt+L`) | Editor Title Bar (Split-Globe), Command Palette | Opens the active file's `http://localhost/...` URL in VS Code's Integrated Browser beside the editor and reloads on save. |
| `Open in Localhost (Browser)` | `localhostOpener.openFromExplorer` | _(none)_ | Explorer & Editor Context Menu | Opens the right-clicked file in the configured browser. |
| `Open in Localhost Split Pane (Live Reload)` | `localhostOpener.openSplitFromExplorer` | _(none)_ | Explorer & Editor Context Menu | Opens the right-clicked file in a split browser pane beside the editor with live reload on save. |
| `Localhost: Copy URL` | `localhostOpener.copy` | _(none)_ | Sidebar Tree Item Inline | Copies the resolved `http://localhost/...` URL to the clipboard. |

## How It Works (Architecture & Internals)

### 1. Path Normalization & Longest-Prefix Matching (`fileToUrl` & `isSafeHttpUrl`)

`fileToUrl(fsPath)` normalizes Windows backslashes to forward slashes, validates each root URL with `isSafeHttpUrl()`, and compares the file path against every entry in `localhostOpener.roots`:

```js
function fileToUrl(fsPath) {
  if (!fsPath || typeof fsPath !== 'string') return null;
  const roots = vscode.workspace.getConfiguration('localhostOpener').get('roots', []);
  if (!Array.isArray(roots)) return null;
  const norm = fsPath.replace(/\\/g, '/');
  const matches = roots
    .filter(r => r && typeof r.path === 'string' && typeof r.url === 'string' && isSafeHttpUrl(r.url))
    .map(r => ({ root: r.path.replace(/\\/g, '/').replace(/\/+$/, ''), url: r.url.trim().replace(/\/+$/, '') }))
    .filter(r => r.root && norm.toLowerCase().startsWith(r.root.toLowerCase() + '/'))
    .sort((a, b) => b.root.length - a.root.length);
  if (!matches.length) return null;
  const m = matches[0];
  const rel = norm.slice(m.root.length);
  return m.url + encodeURI(rel);
}
```

Appending `'/'` to `r.root.toLowerCase()` before `.startsWith()` prevents a root like `C:/MAMP` from matching a sibling folder named `C:/MAMP-old/index.html`. Candidate roots are sorted by character length descending (`b.root.length - a.root.length`), and the remaining relative path is passed through `encodeURI(rel)` so path slashes stay intact while spaces and special characters are percent-encoded.

### 2. Activity Bar Launch & Unmapped File Fallback (`UrlProvider` & `activate`)

`activate()` registers `localhostOpener.view` with `vscode.window.createTreeView` and subscribes to `treeView.onDidChangeVisibility`. When the view becomes visible (`e.visible === true`), the listener inspects `vscode.window.activeTextEditor`:

- If the active editor holds a `file:` URI that matches a configured root, the listener calls `openUrl(url)` and executes `workbench.view.explorer` so the sidebar switches immediately back to the file tree.
- If no editor is active or `fileToUrl()` returns `null`, the sidebar stays open and `UrlProvider.getChildren()` renders a `UrlItem` wired to `localhostOpener.addRoot` (`No localhost root matches this file (click to add)`).

### 3. Document Root Registration (`promptAddRoot` & `warnNoRoot`)

`promptAddRoot()` calls `vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false })` to get the folder path, then prompts for the base URL via `vscode.window.showInputBox({ value: 'http://localhost', ignoreFocusOut: true })` and strips trailing slashes. Before writing to `vscode.ConfigurationTarget.Global`, it deduplicates `localhostOpener.roots` case-insensitively by normalized path (`r.path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() !== normNew`) so updating a folder's port replaces the existing entry in place.

### 4. Split-Pane Integrated Browser & Live Reload (`openSplit`, `supportsIntegratedBrowser`, `isBrowserPreviewOpen`, `trackSave`)

`openSplit(url)` stores `lastSplitUrl = url` and checks whether VS Code's Integrated Browser command (`workbench.action.browser.open`) is available via `supportsIntegratedBrowser()`. When present, it calls `vscode.commands.executeCommand('workbench.action.browser.open', { url, openToSide: true, reuseUrlFilter: url })`, which opens or reuses the Integrated Browser in the side editor group at the resolved `http://localhost/...` URL. On older VS Code builds without `workbench.action.browser.open`, it falls back to `simpleBrowser.api.open` with `{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }`.

When any file is saved (`vscode.workspace.onDidSaveTextDocument`), `trackSave()` verifies that `fileToUrl(doc.uri.fsPath)` is non-null and inspects `vscode.window.tabGroups.all` via `isBrowserPreviewOpen()` to confirm the browser tab is still open. While open, `openSplit(lastSplitUrl)` runs `workbench.action.browser.open` with `reuseUrlFilter: lastSplitUrl` followed by `workbench.action.browser.hardReload` and restores focus to the active text editor (`vscode.window.showTextDocument`). Calling `hardReload` bypasses Chromium's HTTP heuristic cache (`(Date - Last-Modified) * 0.10`) so the very first save and external `.css` or `.js` edits reload immediately. Closing the browser tab clears `lastSplitUrl` via `tabGroups.onDidChangeTabs` so subsequent saves do not reopen the panel.

### 5. Browser Dispatch (`openUrl`)

`openUrl(url)` reads `localhostOpener.browser`. When set to `"simple"`, it delegates to `openSplit(url)` to open the preview pane beside the editor. When set to `"system"` (the default), it opens the URL in the OS default browser via `vscode.env.openExternal(vscode.Uri.parse(url))`.

## Configuration Options

```json
{
  "localhostOpener.roots": [
    {
      "path": "C:\\xampp\\htdocs",
      "url": "http://localhost"
    }
  ],
  "localhostOpener.browser": "system"
}
```

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `localhostOpener.roots` | `Array<{ path: string, url: string }>` | `[]` | Local document root folders and their localhost base URLs. Longest matching `path` wins. |
| `localhostOpener.browser` | `"system" \| "simple"` | `"system"` | Open URLs in the OS default browser (`"system"`) or VS Code's integrated split browser (`"simple"`). |

## Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Warning: `No localhost root matches this file.` | The active file is outside every `path` in `localhostOpener.roots`. | Click **Add Document Root...** on the notification (or run `Localhost: Add Document Root (MAMP / XAMPP)`) and pick your `htdocs` folder. |
| Split pane is blank or shows connection refused | Apache/Nginx is stopped, the port in `localhostOpener.roots` is wrong, or the response sends `X-Frame-Options: DENY`. | Start MAMP/XAMPP, check the port in `localhostOpener.roots`, or press `Ctrl+Alt+O` to open in your system browser. |

## License

MIT
