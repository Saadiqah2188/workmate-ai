<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- AI calls go through one server route (`src/routes/api/ai.ts`) that validates a feature-specific request (`src/lib/ai/tasks.ts`) and streams NDJSON from the Lovable AI Gateway (`src/lib/ai/gateway.server.ts`) — the server builds prompts itself so the public endpoint can only run the app's own features. No database or auth (user requirement).
- Prompt templates live only in `src/lib/ai/prompts.ts` so every feature's structured prompt is tested in one place (`src/lib/ai/ai.test.ts`).
- Browser persistence goes through `usePersistentState` (reads after mount to avoid hydration mismatches).
- Website text for research is fetched via the public Jina Reader because browsers can't read most sites directly (CORS).
