/**
 * ESPN NFL API Client
 * Provides access to ESPN's hidden/unofficial NFL API for real-time game data
 */

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

// ESPN Team ID to our database team abbreviation mapping
const ESPN_TEAM_MAPPING: Record<string, string> = {
  '22': 'ARI', // Arizona Cardinals
  '1': 'ATL',  // Atlanta Falcons
  '33': 'BAL', // Baltimore Ravens
  '2': 'BUF',  // Buffalo Bills
  '29': 'CAR', // Carolina Panthers
  '3': 'CHI',  // Chicago Bears
  '4': 'CIN',  // Cincinnati Bengals
  '5': 'CLE',  // Cleveland Browns
  '6': 'DAL',  // Dallas Cowboys
  '7': 'DEN',  // Denver Broncos
  '8': 'DET',  // Detroit Lions
  '9': 'GB',   // Green Bay Packers
  '34': 'HOU', // Houston Texans
  '11': 'IND', // Indianapolis Colts
  '30': 'JAX', // Jacksonville Jaguars
  '12': 'KC',  // Kansas City Chiefs
  '13': 'LV',  // Las Vegas Raiders
  '24': 'LAC', // Los Angeles Chargers
  '14': 'LAR', // Los Angeles Rams
  '15': 'MIA', // Miami Dolphins
  '16': 'MIN', // Minnesota Vikings
  '17': 'NE',  // New England Patriots
  '18': 'NO',  // New Orleans Saints
  '19': 'NYG', // New York Giants
  '20': 'NYJ', // New York Jets
  '21': 'PHI', // Philadelphia Eagles
  '23': 'PIT', // Pittsburgh Steelers
  '25': 'SF',  // San Francisco 49ers
  '26': 'SEA', // Seattle Seahawks
  '27': 'TB',  // Tampa Bay Buccaneers
  '10': 'TEN', // Tennessee Titans
  '28': 'WAS'  // Washington Commanders
};

export interface ESPNGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
  };
  week: {
    number: number;
  };
  competitions: [{
    id: string;
    date: string;
    attendance: number;
    type: {
      id: string;
      abbreviation: string;
    };
    timeValid: boolean;
    neutralSite: boolean;
    conferenceCompetition: boolean;
    playByPlayAvailable: boolean;
    recent: boolean;
    venue: {
      id: string;
      fullName: string;
      address: {
        city: string;
        state: string;
      };
    };
    competitors: [{
      id: string;
      uid: string;
      type: string;
      order: number;
      homeAway: 'home' | 'away';
      team: {
        id: string;
        uid: string;
        location: string;
        name: string;
        abbreviation: string;
        displayName: string;
        shortDisplayName: string;
        color: string;
        alternateColor: string;
        isActive: boolean;
        venue: {
          id: string;
        };
        links: Array<{
          rel: string[];
          href: string;
          text: string;
          isExternal: boolean;
          isPremium: boolean;
        }>;
        logo: string;
      };
      score: string;
      linescores?: Array<{
        value: number;
      }>;
      statistics: Array<{
        name: string;
        abbreviation: string;
        displayValue: string;
      }>;
      records: Array<{
        name: string;
        abbreviation?: string;
        type: string;
        summary: string;
      }>;
    }];
    notes: Array<any>;
    status: {
      clock: number;
      displayClock: string;
      period: number;
      type: {
        id: string;
        name: string;
        state: string;
        completed: boolean;
        description: string;
        detail: string;
        shortDetail: string;
      };
    };
    broadcasts: Array<{
      market: string;
      names: string[];
    }>;
    leaders: Array<{
      name: string;
      displayName: string;
      shortDisplayName: string;
      abbreviation: string;
      leaders: Array<{
        displayValue: string;
        value: number;
        athlete: {
          id: string;
          fullName: string;
          displayName: string;
          shortName: string;
          links: Array<{
            rel: string[];
            href: string;
          }>;
          headshot: string;
          jersey: string;
          position: {
            abbreviation: string;
          };
          team: {
            id: string;
          };
          active: boolean;
        };
        team: {
          id: string;
        };
      }>;
    }>;
    format: {
      regulation: {
        periods: number;
      };
    };
    startDate: string;
    geoBroadcasts: Array<{
      type: {
        id: string;
        shortName: string;
      };
      market: {
        id: string;
        type: string;
      };
      media: {
        shortName: string;
      };
    }>;
    headlines?: Array<{
      description: string;
      type: string;
      shortLinkText: string;
      video?: Array<{
        id: number;
        headline: string;
        description: string;
        premium: boolean;
        ad: {
          sport: string;
          bundle: string;
        };
        links: {
          api: {
            self: {
              href: string;
            };
            artwork: {
              href: string;
            };
          };
          web: {
            href: string;
            short: {
              href: string;
            };
            self: {
              href: string;
            };
          };
          source: {
            mezzanine: {
              href: string;
            };
            flash: {
              href: string;
            };
            hds: {
              href: string;
            };
            HLS: {
              href: string;
              HD: {
                href: string;
              };
            };
            HD: {
              href: string;
            };
            full: {
              href: string;
            };
            href: string;
          };
          mobile: {
            alert: {
              href: string;
            };
            source: {
              href: string;
            };
            href: string;
            streaming: {
              href: string;
            };
            progressiveDownload: {
              href: string;
            };
          };
        };
        thumbnail: string;
        duration: number;
        tracking: {
          sportName: string;
          leagueName: string;
          coverageType: string;
          trackingName: string;
          trackingId: string;
        };
        cerebroId: string;
        lastModified: string;
        originalPublishDate: string;
      }>;
    }>;
  }];
  links: Array<{
    language: string;
    rel: string[];
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  }>;
  weather?: {
    displayValue: string;
    temperature: number;
    highTemperature: number;
    conditionId: string;
    link: {
      language: string;
      rel: string[];
      href: string;
      text: string;
      shortText: string;
      isExternal: boolean;
      isPremium: boolean;
    };
  };
}

export interface ESPNScoreboard {
  leagues: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    slug: string;
    season: {
      year: number;
      startDate: string;
      endDate: string;
      displayName: string;
      type: {
        id: string;
        type: number;
        name: string;
        abbreviation: string;
      };
    };
    logos: Array<{
      href: string;
      width: number;
      height: number;
      alt: string;
      rel: string[];
      lastUpdated: string;
    }>;
    calendarType: string;
    calendarIsWhitelist: boolean;
    calendarStartDate: string;
    calendarEndDate: string;
    calendar: Array<string>;
  }>;
  season: {
    type: number;
    year: number;
  };
  week: {
    number: number;
  };
  events: ESPNGame[];
}

export interface GameEvent {
  type: 'touchdown' | 'field_goal' | 'safety' | 'game_start' | 'game_end' | 'quarter_end';
  teamId: number;
  description: string;
  timestamp: Date;
  gameId: number;
  score?: {
    home: number;
    away: number;
  };
}

export class NFLApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = ESPN_BASE_URL;
  }

  /**
   * Get current week's scoreboard with all games
   */
  async getScoreboard(year: number = 2025, seasonType: number = 2, week?: number): Promise<ESPNScoreboard> {
    let url = `${this.baseUrl}/scoreboard?year=${year}&seasontype=${seasonType}`;
    if (week) {
      url += `&week=${week}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get specific game details by ESPN game ID
   */
  async getGame(gameId: string): Promise<ESPNGame> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.header.competitions[0];
  }

  /**
   * Convert ESPN team ID to our database team abbreviation
   */
  mapESPNTeamToAbbreviation(espnTeamId: string): string | null {
    return ESPN_TEAM_MAPPING[espnTeamId] || null;
  }

  /**
   * Parse ESPN game data into our database format
   */
  parseGameData(espnGame: ESPNGame): {
    espnId: string;
    week: number;
    homeTeamAbbr: string | null;
    awayTeamAbbr: string | null;
    homeScore: number | null;
    awayScore: number | null;
    gameTime: Date;
    isCompleted: boolean;
    status: string;
  } {
    const competition = espnGame.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    return {
      espnId: espnGame.id,
      week: espnGame.week.number,
      homeTeamAbbr: homeTeam ? this.mapESPNTeamToAbbreviation(homeTeam.team.id) : null,
      awayTeamAbbr: awayTeam ? this.mapESPNTeamToAbbreviation(awayTeam.team.id) : null,
      homeScore: homeTeam?.score ? parseInt(homeTeam.score) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score) : null,
      gameTime: new Date(espnGame.date),
      isCompleted: competition.status.type.completed,
      status: competition.status.type.detail
    };
  }

  /**
   * Extract game events from ESPN game data
   */
  extractGameEvents(espnGame: ESPNGame, previousScore?: { home: number; away: number }): GameEvent[] {
    const events: GameEvent[] = [];
    const competition = espnGame.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return events;

    const currentHomeScore = parseInt(homeTeam.score || '0');
    const currentAwayScore = parseInt(awayTeam.score || '0');

    // Detect scoring changes
    if (previousScore) {
      if (currentHomeScore > previousScore.home) {
        const scoreDiff = currentHomeScore - previousScore.home;
        events.push({
          type: scoreDiff === 6 ? 'touchdown' : scoreDiff === 3 ? 'field_goal' : 'safety',
          teamId: parseInt(homeTeam.team.id),
          description: `${homeTeam.team.displayName} scored ${scoreDiff} points`,
          timestamp: new Date(),
          gameId: parseInt(espnGame.id),
          score: { home: currentHomeScore, away: currentAwayScore }
        });
      }

      if (currentAwayScore > previousScore.away) {
        const scoreDiff = currentAwayScore - previousScore.away;
        events.push({
          type: scoreDiff === 6 ? 'touchdown' : scoreDiff === 3 ? 'field_goal' : 'safety',
          teamId: parseInt(awayTeam.team.id),
          description: `${awayTeam.team.displayName} scored ${scoreDiff} points`,
          timestamp: new Date(),
          gameId: parseInt(espnGame.id),
          score: { home: currentHomeScore, away: currentAwayScore }
        });
      }
    }

    // Detect game status changes
    if (competition.status.type.completed) {
      const winningTeam = currentHomeScore > currentAwayScore ? homeTeam : awayTeam;
      events.push({
        type: 'game_end',
        teamId: parseInt(winningTeam.team.id),
        description: `${winningTeam.team.displayName} wins ${Math.max(currentHomeScore, currentAwayScore)}-${Math.min(currentHomeScore, currentAwayScore)}`,
        timestamp: new Date(),
        gameId: parseInt(espnGame.id),
        score: { home: currentHomeScore, away: currentAwayScore }
      });
    }

    return events;
  }
}

// Export singleton instance
export const nflApi = new NFLApiClient();