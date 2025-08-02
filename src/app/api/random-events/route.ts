import { NextResponse } from 'next/server';

// Alternative test data using random events
const randomSportsEvents = [
  'The quarterback threw a 40-yard touchdown pass!',
  'Field goal is good from 45 yards out!',
  'Interception returned for a touchdown!',
  'Fumble recovered in the end zone for a touchdown!',
  'Safety! Quarterback tackled in his own end zone!',
  'Two-point conversion is successful!',
  'Blocked punt returned for a touchdown!',
  'Kickoff return for 95 yards and a touchdown!',
  '60-yard field goal attempt is good!',
  'Defensive touchdown on a strip sack!',
  'Hail Mary touchdown as time expires!',
  'Pick-six on the first play of the game!'
];

const teamColors = {
  'KC': '#E31837',
  'BUF': '#00338D',
  'SF': '#AA0000',
  'DAL': '#003594',
  'GB': '#203731',
  'NE': '#002244',
  'PIT': '#FFB612',
  'DEN': '#FB4F14'
};

export async function GET() {
  try {
    // Generate a random event
    const teams = Object.keys(teamColors);
    const randomTeam = teams[Math.floor(Math.random() * teams.length)];
    const randomEvent = randomSportsEvents[Math.floor(Math.random() * randomSportsEvents.length)];
    
    const event = {
      id: Date.now(),
      type: 'random_event',
      team: randomTeam,
      description: `${randomTeam}: ${randomEvent}`,
      timestamp: new Date().toISOString(),
      color: teamColors[randomTeam as keyof typeof teamColors],
      score: {
        home: Math.floor(Math.random() * 35),
        away: Math.floor(Math.random() * 35)
      }
    };

    return NextResponse.json({
      success: true,
      event: event,
      message: 'Random sports event generated',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate random event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  // For testing, just return the same as GET
  return GET();
}