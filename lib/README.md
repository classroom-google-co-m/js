# Lunara Game Library

A small static game library with an editor. Open `index.html` directly or host the folder on any static web host.

## Add and manage games

Use **Add game** or the plus button. Add the title and URL, choose a category and launch method, then save. Edit and delete controls are on each card. Changes are saved automatically in this browser using local storage.

## Launch methods

- **Redirect** fetches the remote HTML and writes it into a new tab. The game host must permit cross-origin fetches (CORS).
- **Embedded iframe** places the game in a new blank tab. Some sites block embedding. Sandbox and allow options can be adjusted under Advanced iframe options.
- **Open URL directly** navigates to the game URL.

## Back up or move the library

Choose **Export** to download `lunara-games.json`. Use **Import** to restore that file in another browser. If you want changes visible to everyone on a hosted website, export the JSON and replace `games.json` on your web host; browser local storage only belongs to the current browser.

## Use this database with the original launcher

The updated `lunara-launcher-updated.js` reads the same `lunara-game-database-v1` local-storage key automatically when the launcher and this site run on the same origin. Otherwise, upload the exported JSON to a host that allows CORS, then set `CONFIG.gameDatabaseUrl` in the launcher to that JSON URL. Leave it blank to use the launcher's built-in game list.

The JSON can be an array of games or an object containing a `games` array. Each game supports `title`, `description`, `url`, `category`, `mode` (`redirect`, `iframe`, or `raw`), `iframeTitle`, `iframeAllow`, `iframeSandbox`, and `openInNewTab`.