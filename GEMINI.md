# Project: BackstagePass (Argus)

## Project Overview

**BackstagePass** is a web application designed to be the digital hub for the **Theatergruppe Widen (TGW)**, a theater group. The project, codenamed *Argus*, aims to provide a centralized platform for managing all activities that happen "behind the scenes."

This is a full-stack application built with a modern technology stack:

*   **Frontend:** [Next.js](https://nextjs.org/) (a React framework) with [Tailwind CSS](https://tailwindcss.com/) for styling.
*   **Backend & Database:** [Supabase](https://supabase.io/), a Backend-as-a-Service (BaaS) platform that provides a PostgreSQL database, authentication, and storage.
*   **Hosting:** [Vercel](https://vercel.com/), which is optimized for hosting Next.js applications and integrates seamlessly with Supabase.

The application is structured as a monorepo, with the main web application located in the `apps/web` directory.

### Key Features

*   **Member Management:** A system for managing the personal information, roles, and contact details of the theater group members.
*   **Authentication:** Secure user authentication and authorization handled by Supabase Auth.
*   **Role-Based Access Control (RBAC):** Different user roles (ADMIN, EDITOR, VIEWER) with corresponding permissions.
*   **Audit Logging:** A system for tracking critical user actions for security and compliance.

## Building and Running

The following commands are available to run, build, and test the application. These should be executed from the `apps/web` directory.

| Command | Description |
| :--- | :--- |
| `npm install` | Installs the project dependencies. |
| `npm run dev` | Starts the development server at `http://localhost:3000`. |
| `npm run build` | Creates a production-ready build of the application. |
| `npm run start` | Starts the production server. |
| `npm run lint` | Lints the codebase to identify and fix code style issues. |
| `npm run typecheck` | Performs static type checking using TypeScript. |

### Environment Variables

The application requires a set of environment variables to connect to the Supabase backend. These variables are stored in a `.env.local` file in the `apps/web` directory. A template for this file is provided as `.env.local.template` at the root of the project.

The required variables are:

*   `NEXT_PUBLIC_SUPABASE_URL`: The URL of the Supabase project.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for the Supabase project.

These variables are automatically synced when using the Vercel-Supabase integration.

## Development Conventions

The project follows a set of development conventions to ensure code quality and consistency.

*   **Code Style:** The project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) for linting. The configuration for these tools can be found in the `apps/web` directory.
*   **Git:** The project uses Git for version control. The `.gitignore` file specifies which files and directories should be excluded from the repository. There are also templates for pull requests and issues in the `.github` directory.
*   **Database Migrations:** Database schema changes are managed through SQL migration files located in the `supabase/migrations` directory. These migrations are applied by the Supabase CLI.
*   **Documentation:** The project has extensive documentation in the `docs` directory, covering topics such as architecture, design, and team onboarding.
*   **Journal:** A `journal` directory is used for keeping a development log, recording decisions, and tracking progress.
