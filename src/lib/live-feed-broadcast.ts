/**
 * Live Feed Broadcasting Service
 * Manages SSE connections and broadcasts events to connected users
 */

// SSE connection tracking
const connections = new Map<string, ReadableStreamDefaultController>();

export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

export function removeConnection(userId: string) {
  connections.delete(userId);
}

export function getConnectionCount(): number {
  return connections.size;
}

// Function to broadcast events to connected users
export function broadcastGameEvent(event: any, affectedUserIds: string[]) {
  affectedUserIds.forEach(userId => {
    const controller = connections.get(userId);
    if (controller) {
      try {
        const data = JSON.stringify({
          type: 'game_event',
          event: event,
          timestamp: new Date().toISOString()
        });
        
        controller.enqueue(`data: ${data}\n\n`);
      } catch (error) {
        console.error(`Error broadcasting to user ${userId}:`, error);
        connections.delete(userId);
      }
    }
  });
}

// Function to broadcast elimination notifications
export function broadcastElimination(userId: string, teamName: string, week: number) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const data = JSON.stringify({
        type: 'elimination',
        message: `You have been eliminated! Your pick ${teamName} lost in Week ${week}`,
        team: teamName,
        week: week,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting elimination to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
}

// Function to broadcast general messages
export function broadcastMessage(userId: string, type: string, message: string) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const data = JSON.stringify({
        type: type,
        message: message,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting message to user ${userId}:`, error);
      connections.delete(userId);
    }
  }
}