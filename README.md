# Nutri-Track — Health OS

> Modern, minimal, high-precision health & nutrition operating system.

---

## 1. Project Description

**Nutri-Track** is a rebuilt health management application designed with a focus on performance, minimal aesthetics, high-contrast readability, and modular architecture. Developed feature-by-feature, it delivers robust tracking and insights with a modern, resilient foundation.

---

## 2. Technology Stack

- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org/)
- **Authentication**: [NextAuth.js (Auth.js)](https://next-auth.js.org/) with Credentials Provider & JWT Session Strategy
- **Password Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (12 Salt Rounds)
- **Validation**: [Zod](https://zod.dev/)
- **Language**: [TypeScript (Strict Mode)](https://www.typescriptlang.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Data Fetching & Cache**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Design Tokens (AMOLED / Midnight Dark)
- **Icons & UI**: [Lucide React](https://lucide.dev/)
- **Deployment Target**: [Vercel](https://vercel.com/)

---

## 3. Authentication Architecture

- **Registration (`/register`)**: Server-side validation via Zod, case-insensitive email and username uniqueness checks, bcrypt password hashing (12 rounds), sanitized persistence in PostgreSQL, automatic post-registration login.
- **Login (`/login`)**: Supports dual identifier login (Email OR Username) + Password with bcrypt comparison and secure JWT sessions.
- **Route Protection (`middleware.ts`)**: Automatic redirection of unauthenticated users away from `/app` to `/login?callbackUrl=/app`, and redirection of authenticated users away from auth pages to `/app`.
- **Protected Verification (`/app`)**: Server component verifying session and user profile data from PostgreSQL with a Logout action.

---

## 4. Required Software

- **Node.js**: `v18.18.0` or higher (`v20.x` recommended)
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **PostgreSQL**: Local instance, or cloud provider (Neon, Supabase, Vercel Postgres)

---

## 5. Installation Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd nutri-track
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 6. Environment Variable Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your variables in `.env`:
```env
# Node Environment
NODE_ENV=development

# PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_SECRET="your-32-character-secret-key-goes-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Optional Future Integrations
OPENAI_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 7. Prisma Commands

Generate the Prisma Client:
```bash
npm run prisma:generate
```

Push schema changes directly to the database:
```bash
npm run prisma:db-push
```

Open Prisma Studio to inspect data:
```bash
npm run prisma:studio
```

---

## 8. Local Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Homepage: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`
- Protected Area: `http://localhost:3000/app`
- Health API: `http://localhost:3000/api/health`

---

## 9. Testing & Quality Checks

Run the TypeScript type check:
```bash
npm run type-check
```

Run ESLint:
```bash
npm run lint
```

Run the automated Authentication Test Suite:
```bash
npx tsx scripts/test-auth-flows.ts
```

Create a production build:
```bash
npm run build
```

---

## 10. Vercel Deployment Instructions

1. Push your repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. In the project settings, add the required Environment Variables:
   - `DATABASE_URL` (Connection string to your production PostgreSQL database, e.g. Neon or Supabase)
   - `NEXTAUTH_SECRET` (A strong random 32-character secret)
   - `NEXTAUTH_URL` (Your production domain, e.g. `https://nutritrack.vercel.app`)
4. Build command will automatically run `prisma generate && next build`.
5. Deploy!
