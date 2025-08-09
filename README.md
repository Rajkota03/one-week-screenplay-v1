
# One-Week Screenplay Machine — Next.js Starter (V1.0)

This is the simplest possible starter so you can deploy on **Vercel (free)** and click through:
- Tabs UI
- Working `/api/refine-logline` route calling OpenAI with your server-side key

## How to use (no coding)

1) Create a new GitHub repo (web UI) → **Upload files** from this ZIP.
2) In **Vercel → New Project → Import from GitHub**.
3) In Vercel Project Settings → **Environment Variables**, add:
   - `OPENAI_API_KEY` = your OpenAI key
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4) Click **Deploy**.
5) Open your site → go to the **Logline** tab → type an idea → click **Refine Logline**.

## Next steps
- We’ll add tabs for Ingredients, Characters, Beats, Scenes, Polish, Export.
- Then wire each to your Supabase DB + the backend endpoints you already have.
