# Deployment and maintenance

## 1. What is already set up

| Item | Status |
| --- | --- |
| Supabase project `kydmasong-web` (Singapore, free plan) | Created |
| Database schema, RLS policies, `media` storage bucket | Applied (`supabase/migrations/0001`–`0004`) |
| Migrated content | Seeded (`supabase/seed/seed.sql`) |
| GitHub repository `KTM-EduTech/kydmasong-web` (private) | Code pushed to `main` |
| Netlify site | Not yet created (waiting for approval) |

## 2. Create your administrator account (one time)

There is no default administrator and no default password.

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
   Enter your email and a strong password (12+ characters), tick **Auto Confirm User**.
2. Supabase dashboard → **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';
   ```
3. Supabase → **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
   (Nobody can register themselves; accounts are only created by you in the dashboard.)
4. Sign in at `https://<your-site>/admin`, then go to **Account & security** and turn on two-factor sign-in.

## 3. Environment variables

Set these in Netlify → *Site configuration → Environment variables* (and in Vercel if you move):

| Variable | Where to find it | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API keys → publishable key | No (RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.kydmasong.net` | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → add widget (free) | No |
| `TURNSTILE_SECRET_KEY` | Same widget | **Yes** |
| `CRON_SECRET` | Any long random string you create | **Yes** |

Never put the Supabase `service_role` key or the database password in the website environment.

Supabase → **Authentication → URL Configuration**: set *Site URL* to `https://www.kydmasong.net` and
add your Netlify preview URL (e.g. `https://kydmasong-web.netlify.app`) to *Redirect URLs*.

## 4. Netlify (free plan)

1. Netlify → **Add new project → Import from Git → GitHub → KTM-EduTech/kydmasong-web**.
2. Build settings are read from `netlify.toml` (`npm run build`, Node 22). Add the environment variables above.
3. Deploy. The site is available at `https://<name>.netlify.app` for testing.
4. **Domain** (only when you are ready to switch from the old site): Netlify → *Domain management →
   Add a domain* → `www.kydmasong.net` (and `kydmasong.net` redirecting to it). Then at your DNS provider
   (Cloudflare) point `www` to `<name>.netlify.app` with a CNAME (DNS only / grey cloud), and the apex
   as Netlify instructs. HTTPS is issued automatically. `apps.kydmasong.net` is a separate record and is not affected.

### Netlify credits (free plan: 300 per month, hard limit)

| Usage | Credits | Expected for this site |
| --- | --- | --- |
| Production deploy | 15 each | Only when the **code** changes. Content edits in /admin never deploy. |
| Bandwidth | 20 per GB | Pages are small; most images are served from Supabase/ImageKit |
| Web requests | 2 per 10,000 | |
| Functions compute | 10 per GB-hour | Server rendering, admin actions, form |
| Deploy previews / branch deploys / form submissions | Free | |

If the 300 credits run out, the free plan does not charge you: the site is paused until the next monthly
cycle unless you upgrade. Watch *Team → Usage* in Netlify. If usage grows, upgrade options are Netlify
Personal/Pro or Vercel Pro.

## 5. Scheduled jobs (GitHub Actions, free)

Add repository secrets in GitHub → *Settings → Secrets and variables → Actions*:

- `SITE_URL` = `https://www.kydmasong.net` and `CRON_SECRET` (same value as the website) → enables
  `.github/workflows/keepalive.yml` (daily ping so the free Supabase project is never paused).
- `SUPABASE_DB_URL` = Supabase → *Connect → Session pooler* URI with your database password → enables
  `.github/workflows/backup.yml` (weekly dump kept 90 days under *Actions → artifacts*).

## 6. Database changes

New migrations go in `supabase/migrations/` (timestamped). Apply them in the Supabase SQL editor or with
`supabase db push`, and commit them with the code that needs them. Content never needs migrations.

## 7. Moving to Vercel later

1. Vercel → *Add New Project* → import the same GitHub repository.
2. Add the same environment variables. `netlify.toml` is ignored on Vercel.
3. Optional: set the Functions region to `sin1` (Singapore) to sit next to the database.
4. Move the domain in Vercel → *Domains* and update DNS. No code changes are needed.
