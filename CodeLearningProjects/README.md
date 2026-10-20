# Code learning projects

Minimal C# API plus React front end for small experiments (SSE first; more examples later).

## Structure

- `api/CodeLearning.Api` — ASP.NET Core API (`Features/<Topic>/…`)
- `web` — Vite + React (`src/features/<topic>/…`)

## Run SSE example

Terminal 1 — API (http://localhost:5080):

```bash
dotnet run --project api/CodeLearning.Api
```

Terminal 2 — React (http://localhost:5173):

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. The page opens an SSE connection to `GET /api/sse/stream`. Use **Trigger SSE event** or:

```bash
curl -X POST http://localhost:5080/api/sse/trigger \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from curl"}'
```

The UI should flash and list the received event.

## Debug API + web (breakpoints)

Requires:

- [C# extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) or C# Dev Kit (backend)
- Built-in **JavaScript Debugger** / Chrome (frontend — Cursor launches Chrome for you)

1. Stop `./dev-up.sh` if it is running (`./dev-down.sh`) so ports **5080** and **5173** are free.
2. Set breakpoints in `api/CodeLearning.Api` and/or `web/src` (e.g. `SseDemo.tsx`).
3. **Run and Debug** → **Code Learning: Debug API + Web** → F5.

That builds the API, starts Vite, launches the API under the debugger, and opens Chrome with source maps so React/TS breakpoints work. Stopping the debug session runs `./dev-down.sh` to free ports **5080** and **5173**.

Other configs:

- **Code Learning: API only** — backend debugger only; start `web` yourself.
- **Code Learning: Attach to API** — attach after `./dev-up.sh` (pick the `CodeLearning.Api` process).
