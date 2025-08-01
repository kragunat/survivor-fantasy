/**
 * Game Data Synchronization Service
 * Syncs NFL game data from ESPN API to our database and processes events
 */

import { createAdminClient } from './supabase/admin';
import { nflApi, GameEvent } from './nfl-api';
import { getCurrentNFLWeek } from './nfl-utils';
import { rateLimiter } from './rate-limiter';

export class GameSyncService {
  private supabase: any = null;
  private isRunning = false;

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createAdminClient();
    }
    return this.supabase;
  }

  /**
   * Sync all games for the current week
   */
  async syncCurrentWeek(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️ Sync already running, skipping...');
      return;
    }

    // Rate limit ESPN API calls (max 1 per minute)
    if (!rateLimiter.isAllowed('espn-api-sync', 1, 60000)) {
      console.log('🚦 Rate limited, skipping sync');
      return;
    }

    this.isRunning = true;
    try {
      const currentWeek = getCurrentNFLWeek();
      if (currentWeek === 0) {
        console.log('⏸️ No current NFL week, skipping sync');
        return;
      }

      console.log(`🔄 Syncing games for week ${currentWeek}...`);
      await this.syncWeek(currentWeek);
    } catch (error) {
      console.error('❌ Error syncing current week:', error);
      throw error; // Re-throw for API endpoint to handle
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync games for a specific week
   */
  async syncWeek(week: number, seasonYear: number = 2025): Promise<void> {
    try {
      // Get current games from ESPN
      const scoreboard = await nflApi.getScoreboard(seasonYear, 2, week);
      
      if (!scoreboard.events || scoreboard.events.length === 0) {
        console.log(`No games found for week ${week}`);
        return;
      }

      // Get team ID mappings from database
      const { data: teams } = await this.getSupabase()
        .from('teams')
        .select('id, abbreviation');
      
      const teamMap = new Map<string, number>(teams?.map((t: any) => [t.abbreviation, t.id]) || []);

      // Process each game
      for (const espnGame of scoreboard.events) {
        await this.syncGame(espnGame, teamMap, seasonYear, week);
      }

      console.log(`Successfully synced ${scoreboard.events.length} games for week ${week}`);
    } catch (error) {
      console.error(`Error syncing week ${week}:`, error);
      throw error;
    }
  }

  /**
   * Sync a single game
   */
  private async syncGame(
    espnGame: any,
    teamMap: Map<string, number>,
    seasonYear: number,
    week: number
  ): Promise<void> {
    try {
      const gameData = nflApi.parseGameData(espnGame);
      
      if (!gameData.homeTeamAbbr || !gameData.awayTeamAbbr) {
        console.warn(`Skipping game ${gameData.espnId} - missing team data`);
        return;
      }

      const homeTeamId = teamMap.get(gameData.homeTeamAbbr);
      const awayTeamId = teamMap.get(gameData.awayTeamAbbr);

      if (!homeTeamId || !awayTeamId) {
        console.warn(`Skipping game ${gameData.espnId} - team not found in database`);
        return;
      }

      // Check if game exists in database
      const { data: existingGame } = await this.getSupabase()
        .from('games')
        .select('id, home_score, away_score, is_final')
        .eq('espn_game_id', gameData.espnId)
        .single();

      if (existingGame) {
        // Update existing game
        const { error } = await this.getSupabase()
          .from('games')
          .update({
            home_score: gameData.homeScore,
            away_score: gameData.awayScore,
            is_final: gameData.isCompleted,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingGame.id);

        if (error) {
          console.error(`Error updating game ${gameData.espnId}:`, error);
          return;
        }

        // Process events if score changed or game completed
        const scoreChanged = 
          existingGame.home_score !== gameData.homeScore ||
          existingGame.away_score !== gameData.awayScore;
        
        const gameCompleted = !existingGame.is_final && gameData.isCompleted;

        if (scoreChanged || gameCompleted) {
          await this.processGameEvents(
            existingGame.id,
            espnGame,
            teamMap,
            existingGame.home_score || 0,
            existingGame.away_score || 0
          );

          // If game just completed, process eliminations
          if (gameCompleted) {
            await this.processEliminations(existingGame.id, gameData.homeScore!, gameData.awayScore!);
          }
        }
      } else {
        // Insert new game
        const { data: newGame, error } = await this.getSupabase()
          .from('games')
          .insert({
            season_year: seasonYear,
            week: week,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            home_score: gameData.homeScore,
            away_score: gameData.awayScore,
            game_time: gameData.gameTime.toISOString(),
            is_final: gameData.isCompleted,
            espn_game_id: gameData.espnId
          })
          .select('id')
          .single();

        if (error) {
          console.error(`Error inserting game ${gameData.espnId}:`, error);
          return;
        }

        // Process initial events if game has started
        if (gameData.homeScore !== null && gameData.awayScore !== null) {
          await this.processGameEvents(
            newGame.id,
            espnGame,
            teamMap,
            0,
            0
          );
        }
      }
    } catch (error) {
      console.error(`Error syncing game ${espnGame.id}:`, error);
    }
  }

  /**
   * Process game events and store in database
   */
  private async processGameEvents(
    gameId: number,
    espnGame: any,
    teamMap: Map<string, number>,
    previousHomeScore: number,
    previousAwayScore: number
  ): Promise<void> {
    try {
      const events = nflApi.extractGameEvents(espnGame, {
        home: previousHomeScore,
        away: previousAwayScore
      });

      if (events.length === 0) return;

      // Convert events to database format
      const eventInserts = events.map(event => ({
        game_id: gameId,
        event_type: event.type,
        team_id: teamMap.get(Object.keys(teamMap).find(abbr => 
          teamMap.get(abbr) === event.teamId
        ) || '') || null,
        description: event.description,
        score_home: event.score?.home || null,
        score_away: event.score?.away || null
      }));

      const { error } = await this.getSupabase()
        .from('game_events')
        .insert(eventInserts);

      if (error) {
        console.error(`Error inserting game events for game ${gameId}:`, error);
      } else {
        console.log(`Inserted ${eventInserts.length} events for game ${gameId}`);
      }
    } catch (error) {
      console.error(`Error processing events for game ${gameId}:`, error);
    }
  }

  /**
   * Process eliminations when a game completes
   */
  private async processEliminations(
    gameId: number,
    homeScore: number,
    awayScore: number
  ): Promise<void> {
    try {
      // Get game details
      const { data: game } = await this.getSupabase()
        .from('games')
        .select(`
          id,
          week,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        `)
        .eq('id', gameId)
        .single();

      if (!game) return;

      // Determine losing team
      const losingTeamId = homeScore > awayScore ? game.away_team_id : game.home_team_id;

      // Find all picks for the losing team in this week
      const { data: losingPicks } = await this.getSupabase()
        .from('picks')
        .select(`
          id,
          league_member_id,
          league_members!inner (
            id,
            user_id,
            league_id,
            is_eliminated
          )
        `)
        .eq('team_id', losingTeamId)
        .eq('week', game.week);

      if (!losingPicks || losingPicks.length === 0) return;

      // Eliminate users who picked the losing team
      const eliminationUpdates = losingPicks
        .filter((pick: any) => !pick.league_members.is_eliminated)
        .map((pick: any) => ({
          id: pick.league_members.id,
          is_eliminated: true,
          eliminated_week: game.week
        }));

      if (eliminationUpdates.length > 0) {
        const { error } = await this.getSupabase()
          .from('league_members')
          .upsert(eliminationUpdates);

        if (error) {
          console.error(`Error processing eliminations for game ${gameId}:`, error);
        } else {
          console.log(`Eliminated ${eliminationUpdates.length} players for game ${gameId}`);
          
          // Store elimination events
          const eliminationEvents = eliminationUpdates.map((update: any) => ({
            game_id: gameId,
            event_type: 'elimination' as const,
            team_id: losingTeamId,
            description: `Player eliminated by picking losing team`,
            score_home: homeScore,
            score_away: awayScore
          }));

          await this.getSupabase()
            .from('game_events')
            .insert(eliminationEvents);
        }
      }
    } catch (error) {
      console.error(`Error processing eliminations for game ${gameId}:`, error);
    }
  }

  /**
   * Get recent game events for a user's teams
   */
  async getUserGameEvents(userId: string, limit: number = 20): Promise<any[]> {
    try {
      // Get user's picks across all leagues
      const { data: userPicks } = await this.getSupabase()
        .from('picks')
        .select(`
          team_id,
          week,
          league_members!inner (
            user_id,
            league_id,
            leagues (
              name
            )
          )
        `)
        .eq('league_members.user_id', userId);

      if (!userPicks || userPicks.length === 0) return [];

      const userTeamIds = [...new Set(userPicks.map((pick: any) => pick.team_id))];

      // Get recent events for user's teams
      const { data: events } = await this.getSupabase()
        .from('game_events')
        .select(`
          *,
          games (
            id,
            week,
            season_year,
            home_team:teams!games_home_team_id_fkey (name, abbreviation),
            away_team:teams!games_away_team_id_fkey (name, abbreviation)
          ),
          team:teams (name, abbreviation)
        `)
        .in('team_id', userTeamIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      return events || [];
    } catch (error) {
      console.error('Error getting user game events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const gameSyncService = new GameSyncService();