This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

#################################################

# proctor-exam-web-nextjs
Proctor Exam Web with Nextjs.

# Convert static web site into Nextjs

- IDE: Visual Studio Code

- run project: npm run dev

- install libraries (folder node_modules, nextjs): npm install

- Stack:
App Router
JavaScript
No Tailwind (since you already use CSS)

- Nextjs project structure:

proctor-exam/
  app/ -> api router, server components
    page.js
    start/
      page.js
    create/
      page.js
    layout.js
    globals.css
  components/ -> client components
  public/
    logo.png

- app/layout.js
replace <html>, <head> and global imports

- Home page: index.html -> app/page.tsx

app/page.tsx
app/global.css

- Authentication: Supabase Auth

command: npm install @supabase/ssr @supabase/supabase-js

before:
  Instead of: Clerk Auth
  application name: Proctor Exam Simulator

- Database: Supabase (PostgreSQL):
organization: wodzarod
project name: Proctor Exam Simulator
Database password: Serafines@2025

Create Table in Supabase:
    ...

before:
  Integrate Clerk Authenticacion into Supabase:
    Clerk domain: https://boss-piglet-44.clerk.accounts.dev

- Error Tracking: Sentry
Automatic Configuration:
npx @sentry/wizard@latest -i nextjs --saas --org wodzarod --project proctor-exam-simulator
    Sentry authentication token:
        SENTRY_AUTH_TOKEN=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

- Install Font Awesome:
npm install @fortawesome/fontawesome-free

- Deploy in Vercel:
https://proctor-exam-web-nextjs.vercel.app/
https://proctor-exam-web-nextjs-uuf5.vercel.app/

- Add Language:
Install i18n library: npm install next-intl

/app
  /[locale]
    layout.tsx
	  page.tsx
/components
  LanguageSwitcher.tsx
/messages
  en.json
  es.json
/i18n
  request.ts
next.config.ts
proxy.ts

ref:
https://next-intl.dev/docs/getting-started/app-router
https://learn.next-intl.dev/chapters/03-translations/01-setup

- Resend:
https://resend.com/
https://resend.com/domains

login: zarod2019@gmail.com

- Add my domain in Vercel:
1. Go Vercel project, Settings/Domains

Vercel show you the DNS records

2. Go to Spaceship (my domain provider)

Domain List, winyourexam.site, Manage -> DNS/Nameservers

Add DNS record from Vercel to Spaceship

Finally go your page: https://winyourexam.site

- Configure Supabase Authentication: Email + Password:

Go Supabase/Authentication/URL Configuration:
  Site URL:
    for local: http://localhost:3000
    for production: https://winyourexam.site
    
  redirect URLs:
    for local:
      http://localhost:3000/login
      http://localhost:3000/auth/callback

    for production:
      https://winyourexam.site/login
      https://winyourexam.site/auth/callback   

- Configure Google Login (Google Provider): Google Auth
app/components/AuthDemoPage.tsx
app/email-password/EmailPasswordDemo.tsx

Register our Supabase app in Google Cloud:
  https://cloud.google.com/
  https://console.cloud.google.com/apis/credentials?project=proctor-simulator

  organization: wodzarod
  project: proctor-simulator
  $300 in free credit

  APIs & Services/Credentials
    Configure consent screen
    Click Get Started

    App name: Supabase
    User support email: zarod2019@gmail.com
    Audience: External
    Contact Information: zarod2019@gmail.com
    Finish, Create

  Create our OAuth client:
    Overview/Create OAuth client
    Clients:
      Application type: Web application
      Name: Supabase Client

    Go Supabase/Authentication/Sign In Providers
      Google, click Disabled, copy Callback URL (for OAuth)
      and paste in Google Cloud console in Authorized redirect URIs

      Copy Client ID and Client secret into Supabase (Client IDs and Client Secret (for OAuth))

      check Enable Sign in with Google

  APIs & Services/Credentials, Authorized redirect URIs:
    for local:
      http://localhost:3000/auth/callback
      https://rkckmenanotanktyzbjf.supabase.co/auth/v1/callback
    
    for production:
      https://winyourexam.site/auth/callback
      https://rkckmenanotanktyzbjf.supabase.co/auth/v1/callback

  APIs & Services/Credentials, Authorized JavaScript origins:
    for production:
      https://winyourexam.site

app/google-login
