import { NextResponse } from 'next/server';
import { gameSyncService } from '@/lib/game-sync';
import { getCurrentNFLWeek } from '@/lib/nfl-utils';

// This endpoint will be called by Vercel cron jobs to sync game data
export async function POST() {
  try {
    const startTime = Date.now();
    console.log('🏈 Starting automated game data sync...');
    
    // Check if we're in NFL season
    const currentWeek = getCurrentNFLWeek();
    if (currentWeek === 0) {
      console.log('⏸️ No active NFL season, skipping sync');
      return NextResponse.json({ 
        success: true, 
        message: 'No active NFL season',
        skipped: true,
        timestamp: new Date().toISOString()
      });
    }
    
    await gameSyncService.syncCurrentWeek();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Game sync completed in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game data sync completed successfully',
      week: currentWeek,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Game sync failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Game sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET() {
  try {
    console.log('Manual game data sync triggered...');
    
    await gameSyncService.syncCurrentWeek();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manual game data sync completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Manual game sync failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual game sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}