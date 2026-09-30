# IntelliTrex authentication setup

IntelliTrex uses Supabase Auth with email one-time codes and Google OAuth. Supabase Postgres stores profiles, chat sessions, and portfolio snapshots. The sign-in page remains custom.

## 1. Create a Supabase project

Create a project in the Supabase dashboard and copy its Project URL and publishable key into a local `.env.local` file based on `.env.example`. Keep the service-role key server-only; never use a `NEXT_PUBLIC_` prefix for it or commit `.env.local`.

## 2. Create the database tables and policies

In Supabase Dashboard, open **SQL Editor**, paste and run `supabase/migrations/202609300001_auth_and_user_data.sql`.

The migration creates user profiles and chat sessions, enables row-level security, restricts profile updates to display fields, and provides server-enforced chat and portfolio limits.

## 3. Configure email one-time codes

In **Authentication → Sign In / Providers → Email**, keep email sign-in enabled. Edit the email template so it displays the numeric `{{ .Token }}` value, for example:

```html
<h2>Your IntelliTrex sign-in code</h2>
<p>Enter this six-digit code in IntelliTrex: <strong>{{ .Token }}</strong></p>
```

Set the site URL to `http://localhost:3000` for local development and add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

For email delivery to real users, configure a transactional email provider under **Authentication → Emails → SMTP Settings**. Supabase's built-in SMTP is limited to team-member addresses and currently has a two-email-per-hour limit, so it is suitable only for initial project testing. Configure a provider such as Resend, Amazon SES, Postmark, SendGrid, ZeptoMail, or Brevo; verify the sending domain and publish its SPF/DKIM records. Use an address on that verified domain as the sender. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

## 4. Configure Google sign-in

If enabling Google, create a Web OAuth client in Google Cloud Console. Add `http://localhost:3000` and the production site origin as authorized JavaScript origins. Add the callback URL shown on the Supabase Google provider page as an authorized redirect URI. Enable Google in **Authentication → Sign In / Providers → Google** and store the client ID and secret there.

## 5. Configure redirects and production secrets

Add `http://localhost:3000/auth/callback` and the production `/auth/callback` URL to Supabase's allowed redirect URLs. Copy the values from `.env.example` into `.env.local`, then configure the same environment variables in the deployment provider. The service-role key is required only for account deletion and must remain server-side.

## 6. Grant administrator access

After creating your account through the normal sign-in flow, use Supabase's SQL Editor while signed in as the project owner to set the trusted role claim:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-verified-admin-email@example.com';
```

Sign out and back in so the refreshed access token includes the role. Never put administrator authorization in browser storage or user-editable metadata.

## Local verification

Run `npm run dev`, open `http://localhost:3000/profile`, request an email code, and enter it in the form. Verify a wrong or expired code is rejected, refresh preserves the session, and sign-out returns to the sign-in screen. Verify unauthenticated requests to `/api/chat` and `/api/portfolio` return `401` and each account can read only its own saved sessions and portfolio.
