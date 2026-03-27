import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../common/logger/logger.service';

/**
 * WebSocket Gateway for real-time score updates
 * Requirement 17.2: Implement WebSocket broadcasting of score changes
 * Requirement 17.5: Ensure consistent score information across multiple users
 */
@Injectable()
export class ScoreUpdateGateway {
  server!: Server;
  private connectedClients = new Map<string, Set<string>>(); // matchId -> Set of socketIds

  constructor(private logger: LoggerService) {}

  /**
   * Initialize the gateway with a Socket.io server instance
   */
  setServer(server: Server): void {
    this.server = server;
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for Socket.io
   */
  private setupEventHandlers(): void {
    this.server.on('connection', (socket: Socket) => {
      this.handleConnection(socket);

      socket.on('match:subscribe', (data: { matchId: string }) => {
        this.handleSubscribeToMatch(socket, data);
      });

      socket.on('match:unsubscribe', (data: { matchId: string }) => {
        this.handleUnsubscribeFromMatch(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);

    // Remove client from all match rooms
    for (const [matchId, clients] of this.connectedClients.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.connectedClients.delete(matchId);
        }
      }
    }
  }

  /**
   * Subscribe to match score updates
   * Client sends: { matchId: string }
   */
  handleSubscribeToMatch(client: Socket, data: { matchId: string }): void {
    const { matchId } = data;

    if (!matchId) {
      client.emit('error', { message: 'matchId is required' });
      return;
    }

    // Join Socket.io room for this match
    client.join(`match:${matchId}`);

    // Track connected clients for this match
    if (!this.connectedClients.has(matchId)) {
      this.connectedClients.set(matchId, new Set());
    }
    this.connectedClients.get(matchId)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to match ${matchId}`);
    client.emit('match:subscribed', { matchId });
  }

  /**
   * Unsubscribe from match score updates
   * Client sends: { matchId: string }
   */
  handleUnsubscribeFromMatch(client: Socket, data: { matchId: string }): void {
    const { matchId } = data;

    if (!matchId) {
      client.emit('error', { message: 'matchId is required' });
      return;
    }

    // Leave Socket.io room for this match
    client.leave(`match:${matchId}`);

    // Remove client from tracking
    const clients = this.connectedClients.get(matchId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(matchId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from match ${matchId}`);
    client.emit('match:unsubscribed', { matchId });
  }

  /**
   * Broadcast score update to all clients watching a match
   * Requirement 17.2: Broadcast score changes to connected clients
   * Requirement 17.5: Ensure all users see consistent score information
   */
  broadcastScoreUpdate(
    matchId: string,
    team1Score: number,
    team2Score: number,
    timestamp: Date,
  ): void {
    const room = `match:${matchId}`;
    const connectedCount = this.connectedClients.get(matchId)?.size || 0;

    this.server.to(room).emit('match:score-update', {
      matchId,
      team1Score,
      team2Score,
      timestamp,
      connectedClients: connectedCount,
    });

    this.logger.log(
      `Score update broadcasted for match ${matchId} to ${connectedCount} clients: ${team1Score}-${team2Score}`,
    );
  }

  /**
   * Get number of connected clients for a match
   */
  getConnectedClientsCount(matchId: string): number {
    return this.connectedClients.get(matchId)?.size || 0;
  }

  /**
   * Get all connected matches
   */
  getConnectedMatches(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
