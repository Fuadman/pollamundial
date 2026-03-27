import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return the API greeting', () => {
      const result = controller.getHello();
      expect(result).toBe('Copa América 2024 Sports Prediction System API');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
