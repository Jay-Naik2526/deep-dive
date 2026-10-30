# Ask the diver: AI worker

A tiny Cloudflare Worker that holds the Groq API key. The browser never sees the key.

1. Get a Groq key: console.groq.com > sign in > API Keys > Create API Key. Copy it (shown once).
2. `cd worker && npx wrangler login` (free Cloudflare account) then `npx wrangler secret put GROQ_API_KEY` and paste the key.
3. Edit `ALLOWED_ORIGINS` in `wrangler.toml` to your real site origin(s), then `npx wrangler deploy`. It prints the worker URL.
4. Set `VITE_ASK_URL=<that url>` where the site is built (and in `.env.local` to try it locally), then rebuild.

If the worker is down or unset, the site silently uses the offline engine.
