-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create NFL teams table
CREATE TABLE public.teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  conference TEXT NOT NULL,
  division TEXT NOT NULL
);

-- Create leagues table
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  commissioner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  max_players INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create league members table
CREATE TABLE public.league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_eliminated BOOLEAN DEFAULT FALSE,
  eliminated_week INTEGER,
  UNIQUE(league_id, user_id)
);

-- Create games table
CREATE TABLE public.games (
  id SERIAL PRIMARY KEY,
  season_year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  home_team_id INTEGER NOT NULL REFERENCES public.teams(id),
  away_team_id INTEGER NOT NULL REFERENCES public.teams(id),
  home_score INTEGER,
  away_score INTEGER,
  game_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_final BOOLEAN DEFAULT FALSE
);

-- Create picks table
CREATE TABLE public.picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_member_id UUID NOT NULL REFERENCES public.league_members(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  team_id INTEGER NOT NULL REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(league_member_id, week)
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now() + interval '7 days')
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Leagues policies
CREATE POLICY "Leagues are viewable by members" ON public.leagues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE league_members.league_id = leagues.id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioners can update their leagues" ON public.leagues
  FOR UPDATE USING (commissioner_id = auth.uid());

CREATE POLICY "Users can create leagues" ON public.leagues
  FOR INSERT WITH CHECK (commissioner_id = auth.uid());

-- League members policies
CREATE POLICY "League members viewable by league participants" ON public.league_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = league_members.league_id
      AND lm.user_id = auth.uid()
    )
  );

-- Teams policies (public read)
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

-- Games policies (public read)
CREATE POLICY "Games are viewable by everyone" ON public.games
  FOR SELECT USING (true);

-- Picks policies
CREATE POLICY "Users can view picks in their leagues" ON public.picks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm1
      JOIN public.league_members lm2 ON lm1.league_id = lm2.league_id
      WHERE lm1.id = picks.league_member_id
      AND lm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own picks" ON public.picks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE league_members.id = picks.league_member_id
      AND league_members.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert NFL teams
INSERT INTO public.teams (name, abbreviation, conference, division) VALUES
  ('Arizona Cardinals', 'ARI', 'NFC', 'West'),
  ('Atlanta Falcons', 'ATL', 'NFC', 'South'),
  ('Baltimore Ravens', 'BAL', 'AFC', 'North'),
  ('Buffalo Bills', 'BUF', 'AFC', 'East'),
  ('Carolina Panthers', 'CAR', 'NFC', 'South'),
  ('Chicago Bears', 'CHI', 'NFC', 'North'),
  ('Cincinnati Bengals', 'CIN', 'AFC', 'North'),
  ('Cleveland Browns', 'CLE', 'AFC', 'North'),
  ('Dallas Cowboys', 'DAL', 'NFC', 'East'),
  ('Denver Broncos', 'DEN', 'AFC', 'West'),
  ('Detroit Lions', 'DET', 'NFC', 'North'),
  ('Green Bay Packers', 'GB', 'NFC', 'North'),
  ('Houston Texans', 'HOU', 'AFC', 'South'),
  ('Indianapolis Colts', 'IND', 'AFC', 'South'),
  ('Jacksonville Jaguars', 'JAX', 'AFC', 'South'),
  ('Kansas City Chiefs', 'KC', 'AFC', 'West'),
  ('Las Vegas Raiders', 'LV', 'AFC', 'West'),
  ('Los Angeles Chargers', 'LAC', 'AFC', 'West'),
  ('Los Angeles Rams', 'LAR', 'NFC', 'West'),
  ('Miami Dolphins', 'MIA', 'AFC', 'East'),
  ('Minnesota Vikings', 'MIN', 'NFC', 'North'),
  ('New England Patriots', 'NE', 'AFC', 'East'),
  ('New Orleans Saints', 'NO', 'NFC', 'South'),
  ('New York Giants', 'NYG', 'NFC', 'East'),
  ('New York Jets', 'NYJ', 'AFC', 'East'),
  ('Philadelphia Eagles', 'PHI', 'NFC', 'East'),
  ('Pittsburgh Steelers', 'PIT', 'AFC', 'North'),
  ('San Francisco 49ers', 'SF', 'NFC', 'West'),
  ('Seattle Seahawks', 'SEA', 'NFC', 'West'),
  ('Tampa Bay Buccaneers', 'TB', 'NFC', 'South'),
  ('Tennessee Titans', 'TEN', 'AFC', 'South'),
  ('Washington Commanders', 'WAS', 'NFC', 'East');