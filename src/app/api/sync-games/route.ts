import { NextResponse } from 'next/server';
import { gameSyncService } from '@/lib/game-sync';

// This endpoint will be called by a cron job or manually to sync game data
export async function POST() {
  try {
    console.log('Starting game data sync...');
    
    await gameSyncService.syncCurrentWeek();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game data sync completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Game sync failed:', error);
    
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