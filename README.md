# ALX-Polly: A Real-time Polling Application

ALX-Polly is a full-stack web application that allows users to create, manage, and vote on real-time polls. It provides a simple and intuitive interface for users to create polls, share them with others, and see the results in real-time. The application is built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v14+ with App Router)
- **Database**: [Supabase](https://supabase.io/) (PostgreSQL)
- **Authentication**: [Supabase Auth](https://supabase.io/docs/guides/auth)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **ORM**: [Supabase-js](https://supabase.io/docs/library/js/getting-started)
- **Validation**: [Zod](https://zod.dev/)

## Features

- User authentication (email/password and social logins)
- Create, edit, and delete polls
- Public and private polls
- Real-time voting with instant updates
- QR code generation for easy poll sharing
- User dashboard to manage polls
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/alx-polly.git
   cd alx-polly
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Supabase:**

   - Create a new project on [Supabase](https://app.supabase.io/).
   - Go to the **SQL Editor** and run the SQL script from `database-schema.sql` to create the necessary tables and functions.
   - In your Supabase project, go to **Settings** > **API**.
   - Find your **Project URL** and **anon public** key.

4. **Configure environment variables:**

   - Create a `.env.local` file in the root of the project.
   - Add the following environment variables to the file:

     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

### Running the Application

To run the development server, use the following command:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Testing

To run the tests, use the following command:

```bash
npm test
```

## Usage

### Creating a Poll

1. Log in to your account.
2. Click on the **Create New Poll** button.
3. Fill in the poll details, including the title, description, and options.
4. Configure the poll settings, such as allowing multiple votes or requiring authentication.
5. Click on the **Create Poll** button.

### Voting on a Poll

1. Open the poll link or scan the QR code.
2. Select your desired option(s).
3. Click on the **Submit Vote** button.

## Deployment

The easiest way to deploy this application is with [Vercel](https://vercel.com/). You can connect your GitHub repository to Vercel and it will automatically deploy the application whenever you push new changes.