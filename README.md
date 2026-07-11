# Brightpath — School Management System

A full school management system built with **Next.js 16 (App Router)**, **Prisma + MySQL**, and **NextAuth v5** for role-based login (Admin / Teacher / Student / Parent).

**Modules:** Students & Teachers · Attendance · Grades & Exams · Fees & Invoicing · Timetable · Class & Subject management.

---

## 1. Get a free MySQL database (Aiven)

1. Go to **https://aiven.io/free-mysql-database** and sign up (no credit card needed).
2. Click **Create service** → choose **MySQL** → pick the free plan → pick any region → create.
3. Once it's running, open the service and copy the **connection string** (or build one from Host / Port / User / Password / Database shown on the **Overview** tab). It looks like:
   ```
   mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED
   ```
   > Free Aiven services pause after a period of inactivity — you'll get an email warning first, and can resume it with one click.

Any other MySQL host works too (Railway, PlanetScale, a shared host, etc.) — just paste its connection string in step 4 below.

## 2. Create a GitHub repository

1. Go to **https://github.com/new**.
2. Name it (e.g. `school-management-system`), keep it **Private** or **Public** as you prefer, leave "Add a README" **unchecked** (this project already has one), then **Create repository**.
3. You'll land on a page with a repo URL like `https://github.com/YOUR_USERNAME/school-management-system.git` — copy it.

To let me push the code directly, add me as a collaborator or generate a **fine-grained personal access token** (Settings → Developer settings → Personal access tokens → Fine-grained → grant it `Contents: Read and write` on this one repo) and share the repo URL + token. Otherwise, download the project and push it yourself:

```bash
cd school-management-system
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/school-management-system.git
git push -u origin main
```

## 3. Create the Vercel project

1. Go to **https://vercel.com/new** and sign in (GitHub login is easiest).
2. Click **Import** next to your `school-management-system` repo (install the Vercel GitHub App if prompted, and grant it access to the repo).
3. Vercel auto-detects Next.js. Before clicking **Deploy**, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Aiven MySQL connection string from step 1 |
   | `NEXTAUTH_SECRET` | a random secret — generate one with `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | your Vercel URL, e.g. `https://school-management-system.vercel.app` (you can add this after the first deploy once you know the URL, then redeploy) |

4. Click **Deploy**. From now on, every push to `main` on GitHub automatically triggers a new build on Vercel.

## 4. Set up the database schema and demo data

Run this **once**, from your own machine (with Node 18+ installed), pointing at the same `DATABASE_URL` you gave Vercel:

```bash
npm install
echo 'DATABASE_URL="your-aiven-connection-string"' > .env
npx prisma db push     # creates all tables in your MySQL database
npm run db:seed        # loads demo classes, students, grades, fees, timetable
```

`prisma db push` reads your schema (`prisma/schema.prisma`) and creates the matching tables directly — no separate migration files needed for a first setup like this.

## 5. Log in

Visit your Vercel URL (or `http://localhost:3000` if running locally with `npm run dev`) and sign in with:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@brightpath.edu` | `admin123` |
| Teacher | `teacher@brightpath.edu` | `teacher123` |
| Student | `student@brightpath.edu` | `student123` |

**Change these passwords** (or delete the demo accounts and create real ones from the Teachers/Students pages) before using this for real students' data.

---

## What each role can do

- **Admin** — full access: manage students, teachers, classes, subjects, exams, fee invoices & payments, timetable.
- **Teacher** — mark attendance and enter grades for their assigned classes/subjects; view their timetable.
- **Student** — view their own attendance, grades, fee invoices, and timetable.
- **Parent** — same read-only view as their linked child (parent-child linking is done by an admin, currently via direct database access — see "Extending" below).

## Local development

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma db push
npm run db:seed
npm run dev
```

## Project structure

```
app/
  login/                 sign-in page
  (app)/                 authenticated shell (sidebar + topbar)
    dashboard/            role-specific overview
    students/              admin & teacher: student roster CRUD
    teachers/              admin: staff CRUD
    classes/                admin: classes & subjects
    attendance/              staff: mark attendance · family: view history
    exams/                    staff: exams & grade entry · family: view grades
    fees/                      admin: invoices & payments · family: view invoices
    timetable/                 admin: weekly schedule builder · everyone: view
lib/
  actions/               server actions (one file per module)
  prisma.ts              Prisma client singleton
  rbac.ts                role-check helpers
prisma/
  schema.prisma          full data model
  seed.ts                demo data
```

## Extending this

- **Parent portal linking**: currently a `Parent` record's `children` relation is set directly in the database (or you can add a small admin UI for it — the `Parent`/`Student.parentId` fields already exist in the schema).
- **Password reset / email**: not included — add a provider (e.g. Resend) and a reset-token flow if needed.
- **File uploads** (report cards as PDF, student photos): add a storage provider (e.g. Vercel Blob or S3).
- **Payments online**: `FeePayment` records are entered manually by an admin; wire up Stripe/PayPal if you want parents to pay online.
