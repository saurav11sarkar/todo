import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';
import buildWhereConditions from 'src/app/helper/buildWhereConditions';
import { WhatsappOrSmsService } from 'src/app/helper/whatappOrSms';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappOrSms: WhatsappOrSmsService,
    private readonly redis: RedisService,
  ) {}

  async getUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async createTodo(userId: string, dto: CreateTodoDto) {
    const result = await this.prisma.todo.create({
      data: {
        title: dto.title,
        description: dto.description,
        isComplete: dto.isComplete ?? false,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        userId,
      },
    });

    if (!result)
      throw new HttpException('Todo not created', HttpStatus.BAD_REQUEST);

    // ✅ Cache invalidate — নতুন todo তৈরি হলে list cache মুছে দাও
    await this.redis.delByPattern(`todo:list:${userId}:*`);

    return result;
  }

  async findAll(userId: string, params: IFilterParams, options: IOptions) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User is not found', 404);

    // ✅ Cache key তৈরি — query params অনুযায়ী unique key
    const cacheKey = `todo:list:${userId}:${JSON.stringify({ params, options })}`;

    // ✅ আগে Redis-এ খোঁজ
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Cache MISS: ${cacheKey} — querying DB`);

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenCondition = buildWhereConditions(
      params,
      ['title', 'description'],
      { userId },
    );

    const [result, total] = await Promise.all([
      this.prisma.todo.findMany({
        where: whenCondition,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.todo.count({ where: whenCondition }),
    ]);

    const response = { data: result, meta: { total, page, limit } };

    // ✅ Redis-এ 5 মিনিট cache রাখো
    await this.redis.set(cacheKey, response, 300);

    return response;
  }

  async findOne(userId: string, id: string) {
    // ✅ Single todo cache
    const cacheKey = `todo:single:${userId}:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const result = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!result)
      throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);

    // ✅ 10 মিনিট cache
    await this.redis.set(cacheKey, result, 600);

    return result;
  }

  async updateTodo(userId: string, id: string, dto: UpdateTodoDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User is not found', 404);

    const existing = await this.findOne(userId, id);
    const isNowCompleting = dto.isComplete === true && !existing.isComplete;

    const completedAt = isNowCompleting
      ? new Date()
      : dto.isComplete === false
        ? null
        : existing.completedAt;

    const deadlineChanged =
      dto?.deadline !== undefined &&
      (dto?.deadline as any) !== existing.deadline?.toISOString();

    const result = await this.prisma.todo.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isComplete !== undefined && { isComplete: dto.isComplete }),
        ...(dto.deadline !== undefined && { deadline: new Date(dto.deadline) }),
        completedAt,
        ...(deadlineChanged && { whatsappNotified: false, reminderSent: false }),
      },
    });

    if (!result)
      throw new HttpException('Todo not updated', HttpStatus.BAD_REQUEST);

    // ✅ Cache invalidate — update হলে পুরনো cache মুছে দাও
    await this.redis.del(`todo:single:${userId}:${id}`);
    await this.redis.delByPattern(`todo:list:${userId}:*`);

    // Send completion message (WhatsApp → SMS fallback)
    if (
      isNowCompleting &&
      user.whatsappNumber &&
      this.whatsappOrSms.isEnabled()
    ) {
      const msg = this.whatsappOrSms.completedMessage(result.title);
      await this.whatsappOrSms.sendMessage(user.whatsappNumber, msg);
      this.logger.log(`✅ Completion message sent for: "${result.title}"`);
    }

    return result;
  }

  async removeTodo(userId: string, id: string) {
    await this.findOne(userId, id);
    const result = await this.prisma.todo.delete({ where: { id } });
    if (!result)
      throw new HttpException('Todo not deleted', HttpStatus.BAD_REQUEST);

    // ✅ Cache invalidate — delete হলে cache মুছে দাও
    await this.redis.del(`todo:single:${userId}:${id}`);
    await this.redis.delByPattern(`todo:list:${userId}:*`);

    return result;
  }

  // Called by scheduler — overdue tasks
  async findOverdueTodos() {
    const now = new Date();
    return this.prisma.todo.findMany({
      where: {
        isComplete: false,
        whatsappNotified: false,
        deadline: { lt: now },
      },
      include: { user: true },
    });
  }

  // Called by scheduler — upcoming tasks (e.g. 30 min warning)
  async findUpcomingTodos(minutesAhead: number) {
    const now = new Date();
    const future = new Date(now.getTime() + minutesAhead * 60 * 1000);
    const buffer = new Date(now.getTime() + (minutesAhead - 1) * 60 * 1000);

    return this.prisma.todo.findMany({
      where: {
        isComplete: false,
        reminderSent: false,
        deadline: { gte: buffer, lte: future },
      },
      include: { user: true },
    });
  }

  async markNotified(id: string) {
    return this.prisma.todo.update({
      where: { id },
      data: { whatsappNotified: true },
    });
  }

  async markReminderSent(id: string) {
    return this.prisma.todo.update({
      where: { id },
      data: { reminderSent: true },
    });
  }

  /**
   * Reset notification flags for all incomplete overdue tasks of a user.
   * This allows the scheduler to re-send notifications.
   */
  async resetNotifications(userId: string): Promise<number> {
    const result = await this.prisma.todo.updateMany({
      where: {
        userId,
        isComplete: false,
        deadline: { lt: new Date() },
        whatsappNotified: true,
      },
      data: {
        whatsappNotified: false,
        reminderSent: false,
      },
    });
    return result.count;
  }
}
