/**
 * NFL Season Utilities
 */

// NFL season typically starts first Thursday after Labor Day (early September)
// For 2025, let's assume it starts September 4th
const SEASON_START_2025 = new Date('2025-09-04T00:00:00Z');

/**
 * Get the current NFL week based on the date
 * @param currentDate - The date to check (defaults to now)
 * @returns The current week number (1-18) or 0 if before season/after season
 */
export function getCurrentNFLWeek(currentDate: Date = new Date()): number {
  const seasonStart = SEASON_START_2025;
  
  // If before season start, return 0
  if (currentDate < seasonStart) {
    return 0;
  }
  
  // Calculate weeks since season start
  const daysSinceStart = Math.floor((currentDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  
  // NFL regular season is 18 weeks
  if (weeksSinceStart >= 18) {
    return 0; // Post-season
  }
  
  return weeksSinceStart + 1;
}

/**
 * Get the pickable week based on current date and time
 * - Current week's picks lock at first game time (usually Thursday 8:20 PM ET)
 * - Next week's picks become available after Monday Night Football ends (usually ~11:30 PM ET)
 * 
 * @param currentDate - The date to check (defaults to now)
 * @returns The week number that can currently be picked
 */
export function getPickableWeek(currentDate: Date = new Date()): number {
  const currentWeek = getCurrentNFLWeek(currentDate);
  
  if (currentWeek === 0) {
    return 1; // Before season or after season, show week 1
  }
  
  // Get the Thursday of the current week (when picks lock)
  const weekStart = new Date(SEASON_START_2025);
  weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
  
  // Thursday 8:20 PM ET (convert to UTC: ET is UTC-4 in September)
  const thursdayLockTime = new Date(weekStart);
  thursdayLockTime.setDate(weekStart.getDate() + 0); // Thursday is day 0 of NFL week
  thursdayLockTime.setHours(20 + 4, 20, 0, 0); // 8:20 PM ET = 12:20 AM UTC next day
  
  // Monday 11:30 PM ET (when MNF typically ends)
  const mondayUnlockTime = new Date(weekStart);
  mondayUnlockTime.setDate(weekStart.getDate() + 4); // Monday is day 4 of NFL week
  mondayUnlockTime.setHours(23 + 4, 30, 0, 0); // 11:30 PM ET = 3:30 AM UTC next day
  
  // If we're before Thursday's lock time, current week is pickable
  if (currentDate < thursdayLockTime) {
    return currentWeek;
  }
  
  // If we're after Monday unlock time, next week is pickable
  if (currentDate >= mondayUnlockTime && currentWeek < 18) {
    return currentWeek + 1;
  }
  
  // Between Thursday and Monday, no picks available
  return 0;
}

/**
 * Check if picks are currently locked (between Thursday game time and Monday night)
 */
export function arePicksLocked(currentDate: Date = new Date()): boolean {
  const currentWeek = getCurrentNFLWeek(currentDate);
  const pickableWeek = getPickableWeek(currentDate);
  
  // If current week is 0 or pickable week matches current/next week, picks are open
  return currentWeek > 0 && pickableWeek === 0;
}

/**
 * Get a display string for when picks will unlock
 */
export function getPicksUnlockTime(currentDate: Date = new Date()): string {
  if (!arePicksLocked(currentDate)) {
    return '';
  }
  
  const currentWeek = getCurrentNFLWeek(currentDate);
  const weekStart = new Date(SEASON_START_2025);
  weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
  
  const mondayUnlockTime = new Date(weekStart);
  mondayUnlockTime.setDate(weekStart.getDate() + 4); // Monday
  mondayUnlockTime.setHours(23 + 4, 30, 0, 0); // 11:30 PM ET
  
  return mondayUnlockTime.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Get the deadline for making picks for a given week
 */
export function getPickDeadline(week: number): Date {
  const weekStart = new Date(SEASON_START_2025);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  
  const thursdayLockTime = new Date(weekStart);
  thursdayLockTime.setDate(weekStart.getDate() + 0); // Thursday
  thursdayLockTime.setHours(20 + 4, 20, 0, 0); // 8:20 PM ET
  
  return thursdayLockTime;
}