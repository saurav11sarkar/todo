import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import config from 'src/app/config';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error('Redis: Max retries reached');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis Error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }

  async onModuleInit() {
    try {
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        this.logger.log('✅ Redis Stack is ready!');
      }
    } catch (error) {
      this.logger.error('❌ Redis connection failed!', error.message);
    }
  }

  // ─── GET (JSON parse সহ) ──────────────────────────────────────────────────
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Redis GET error [${key}]:`, error.message);
      return null;
    }
  }

  // ─── SET (auto JSON stringify) ────────────────────────────────────────────
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds ?? config.redis.ttl;
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.error(`Redis SET error [${key}]:`, error.message);
    }
  }

  // ─── DELETE single key ────────────────────────────────────────────────────
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error [${key}]:`, error.message);
    }
  }

  // ─── DELETE by pattern (e.g. "todo:user123:*") ────────────────────────────
  async delByPattern(pattern: string): Promise<number> {
    try {
      let deleted = 0;
      const stream = this.client.scanStream({ match: pattern, count: 100 });

      return new Promise((resolve, reject) => {
        stream.on('data', async (keys: string[]) => {
          if (keys.length > 0) {
            const count = await this.client.del(...keys);
            deleted += count;
          }
        });
        stream.on('end', () => {
          if (deleted > 0) {
            this.logger.log(`Deleted ${deleted} keys matching: ${pattern}`);
          }
          resolve(deleted);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Redis DEL pattern error [${pattern}]:`, error.message);
      return 0;
    }
  }

  // ─── CHECK key exists ─────────────────────────────────────────────────────
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  // ─── SET TTL on existing key ──────────────────────────────────────────────
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error [${key}]:`, error.message);
    }
  }

  // ─── INCREMENT (rate limiting, counters) ──────────────────────────────────
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR error [${key}]:`, error.message);
      return 0;
    }
  }

  // ─── GET raw Redis client (advanced use) ──────────────────────────────────
  getClient(): Redis {
    return this.client;
  }

  // ─── Health Check ─────────────────────────────────────────────────────────
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
