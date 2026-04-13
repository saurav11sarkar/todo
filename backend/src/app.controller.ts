import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✅ Health Check — Redis + App status
  @Get('health')
  @SkipThrottle()
  async healthCheck() {
    const redisHealthy = await this.redis.isHealthy();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        app: true,
        redis: redisHealthy,
      },
    };
  }
}
