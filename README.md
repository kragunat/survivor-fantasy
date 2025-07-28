# Survivor Fantasy League

A Next.js-based web application for running NFL Survivor League pools, where players pick one team to win each week but can only use each team once per season.

## Features

- 🏈 NFL Survivor League management
- 🔐 Authentication with email/password and Google OAuth
- 👥 Create and join multiple leagues
- 📊 Track picks and eliminations
- 🎯 Automated game result tracking
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Supabase integration
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/survivor-fantasy.git
   cd survivor-fantasy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in the Supabase SQL editor
   - Go to Project Settings > API
   - Copy your project URL and the new API keys (look for keys starting with `sb_`)

4. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_starting_with_sb_publishable_
     SUPABASE_SECRET_KEY=your_key_starting_with_sb_secret_
     ```
   - Note: We use the new key format to avoid migration issues in late 2025
   - Generate a NextAuth secret:
     ```bash
     openssl rand -base64 32
     ```
   - Add it to `.env.local`:
     ```
     NEXTAUTH_SECRET=your_generated_secret
     ```

5. **Set up Google OAuth (optional)**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Add credentials to `.env.local`:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Remember to update your OAuth redirect URIs to your production domain.

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles
- `leagues` - League information
- `league_members` - League membership and elimination status
- `teams` - NFL teams
- `games` - NFL game schedules and results
- `picks` - User picks for each week
- `invitations` - League invitation codes

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Contributing

Pull requests are welcome! Please read our contributing guidelines first.

## License

MIT