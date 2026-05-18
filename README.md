## Auth setup

Run the React app and the auth API in separate terminals:

```bash
npm run server
npm start
```

For a single production service:

```bash
npm run build
npm run start:prod
```

The Node server serves `/api/*` from `server/server.js` and serves the React build for all other routes.
Health checks can use `/api/health`.

There is also a `render.yaml` blueprint for deploying as one Render web service. It mounts a small persistent disk at `/var/data` and points `DATA_DIR` there. This is acceptable as a transitional setup, but a real database is still recommended before serious public use.

The local auth API stores development users in `server/data/auth-db.json`, which is ignored by Git. Email verification codes are printed in the server console unless you replace `issueVerification` in `server/server.js` with a real email provider.

Set these environment variables before production use:

```bash
NODE_ENV=production
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=https://your-domain.com
DATA_DIR=/var/data
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Tribble <noreply@your-domain.com>
```

Google sign-in requires the same OAuth client ID on the server and React app.

Copy `.env.example` when configuring a host. In production, the server will refuse to start without `JWT_SECRET`.

The auth API includes basic in-memory rate limiting and 60-second verification/reset code cooldowns. For multi-instance hosting, replace the in-memory limiter with a shared store such as Redis.

Email verification and password reset codes use Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Without those variables, codes are printed in the server console for local development.

## Static Hosting (GitHub Pages) + Supabase

GitHub Pages is static-only. To host Tribble there with real sign-in and email verification, configure Supabase and set:

```bash
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

When Supabase is enabled, Tribble uses Supabase Auth in the browser (no Node server required for login/signup/verify/reset). Supabase password reset is handled via the email link (not a 6-digit code).

### Account deletion

Account deletion is not currently supported from within the app.

### GitHub Pages deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

In GitHub, add these repository secrets:

```bash
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
```

Then enable Pages:
- Settings -> Pages -> Build and deployment -> Source: GitHub Actions

The site will deploy from `main` to `https://shuvraneelmitra.github.io/tribble`.
