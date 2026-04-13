import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // পুরো app জুড়ে available — কোনো module-এ import করতে হবে না
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
