import { Test, TestingModule } from '@nestjs/testing';
import { ScoreUpdateGateway } from './score-update.gateway';
import { LoggerService } from '../common/logger/logger.service';
import { v4 as uuid } from 'uuid';

describe('ScoreUpdateGateway', () => {
  let gateway: ScoreUpdateGateway;
  let logger: jest.Mocked<LoggerService>;

  const mockMatchId = uuid();
  const mockClientId1 = uuid();
  const mockClientId2 = uuid();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreUpdateGateway,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ScoreUpdateGateway>(ScoreUpdateGateway);
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;

    // Mock the server
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const mockClient = { id: mockClientId1 } as any;

      gateway.handleConnection(mockClient);

      expect(logger.log).toHaveBeenCalledWith(`WebSocket client connected: ${mockClientId1}`);
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const mockClient = { id: mockClientId1 } as any;

      gateway.handleDisconnect(mockClient);

      expect(logger.log).toHaveBeenCalledWith(`WebSocket client disconnected: ${mockClientId1}`);
    });

    it('should remove client from all match rooms', () => {
      const mockClient = { id: mockClientId1 } as any;

      // Manually add client to a match room
      gateway['connectedClients'].set(mockMatchId, new Set([mockClientId1]));

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has(mockMatchId)).toBe(false);
    });
  });

  describe('handleSubscribeToMatch', () => {
    it('should subscribe client to match', () => {
      const mockClient = {
        id: mockClientId1,
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      gateway.handleSubscribeToMatch(mockClient, { matchId: mockMatchId });

      expect(mockClient.join).toHaveBeenCalledWith(`match:${mockMatchId}`);
      expect(mockClient.emit).toHaveBeenCalledWith('match:subscribed', { matchId: mockMatchId });
      expect(gateway['connectedClients'].get(mockMatchId)?.has(mockClientId1)).toBe(true);
    });

    it('should emit error if matchId is missing', () => {
      const mockClient = {
        id: mockClientId1,
        emit: jest.fn(),
      } as any;

      gateway.handleSubscribeToMatch(mockClient, { matchId: '' });

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'matchId is required' });
    });

    it('should handle multiple clients subscribing to same match', () => {
      const mockClient1 = {
        id: mockClientId1,
        join: jest.fn(),
        emit: jest.fn(),
      } as any;
      const mockClient2 = {
        id: mockClientId2,
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      gateway.handleSubscribeToMatch(mockClient1, { matchId: mockMatchId });
      gateway.handleSubscribeToMatch(mockClient2, { matchId: mockMatchId });

      expect(gateway['connectedClients'].get(mockMatchId)?.size).toBe(2);
    });
  });

  describe('handleUnsubscribeFromMatch', () => {
    it('should unsubscribe client from match', () => {
      const mockClient = {
        id: mockClientId1,
        leave: jest.fn(),
        emit: jest.fn(),
      } as any;

      // Add client to match first
      gateway['connectedClients'].set(mockMatchId, new Set([mockClientId1]));

      gateway.handleUnsubscribeFromMatch(mockClient, { matchId: mockMatchId });

      expect(mockClient.leave).toHaveBeenCalledWith(`match:${mockMatchId}`);
      expect(mockClient.emit).toHaveBeenCalledWith('match:unsubscribed', { matchId: mockMatchId });
      expect(gateway['connectedClients'].has(mockMatchId)).toBe(false);
    });

    it('should emit error if matchId is missing', () => {
      const mockClient = {
        id: mockClientId1,
        emit: jest.fn(),
      } as any;

      gateway.handleUnsubscribeFromMatch(mockClient, { matchId: '' });

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'matchId is required' });
    });
  });

  describe('broadcastScoreUpdate', () => {
    it('should broadcast score update to match room', () => {
      const mockEmit = jest.fn();
      gateway.server.to = jest.fn().mockReturnValue({ emit: mockEmit });

      // Add clients to match
      gateway['connectedClients'].set(mockMatchId, new Set([mockClientId1, mockClientId2]));

      const timestamp = new Date();
      gateway.broadcastScoreUpdate(mockMatchId, 2, 1, timestamp);

      expect(gateway.server.to).toHaveBeenCalledWith(`match:${mockMatchId}`);
      expect(mockEmit).toHaveBeenCalledWith('match:score-update', {
        matchId: mockMatchId,
        team1Score: 2,
        team2Score: 1,
        timestamp,
        connectedClients: 2,
      });
    });

    it('should handle broadcast with no connected clients', () => {
      const mockEmit = jest.fn();
      gateway.server.to = jest.fn().mockReturnValue({ emit: mockEmit });

      const timestamp = new Date();
      gateway.broadcastScoreUpdate(mockMatchId, 2, 1, timestamp);

      expect(mockEmit).toHaveBeenCalledWith('match:score-update', {
        matchId: mockMatchId,
        team1Score: 2,
        team2Score: 1,
        timestamp,
        connectedClients: 0,
      });
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return count of connected clients for a match', () => {
      gateway['connectedClients'].set(mockMatchId, new Set([mockClientId1, mockClientId2]));

      const count = gateway.getConnectedClientsCount(mockMatchId);

      expect(count).toBe(2);
    });

    it('should return 0 if no clients connected to match', () => {
      const count = gateway.getConnectedClientsCount(mockMatchId);

      expect(count).toBe(0);
    });
  });

  describe('getConnectedMatches', () => {
    it('should return list of all connected matches', () => {
      const matchId2 = uuid();
      gateway['connectedClients'].set(mockMatchId, new Set([mockClientId1]));
      gateway['connectedClients'].set(matchId2, new Set([mockClientId2]));

      const matches = gateway.getConnectedMatches();

      expect(matches).toContain(mockMatchId);
      expect(matches).toContain(matchId2);
      expect(matches.length).toBe(2);
    });

    it('should return empty array if no matches connected', () => {
      const matches = gateway.getConnectedMatches();

      expect(matches).toEqual([]);
    });
  });
});
