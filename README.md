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

- Authentication: Clerk Auth
application name: Proctor Exam Simulator

- Database: Supabase (PostgreSQL):
organization: wodzarod
project name: Proctor Exam Simulator
Database password: Serafines@2025

Integrate Clerk Authenticacion into Supabase:
    Clerk domain: https://boss-piglet-44.clerk.accounts.dev

Create Table in Supabase:
    ...

- Error Tracking: Sentry
Automatic Configuration:
npx @sentry/wizard@latest -i nextjs --saas --org wodzarod --project proctor-exam-simulator
    Sentry authentication token:
        SENTRY_AUTH_TOKEN=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

- Install Font Awesome:
npm install @fortawesome/fontawesome-free

