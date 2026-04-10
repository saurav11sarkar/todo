import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('todo')
@UseGuards(AuthGuard('user'))
@ApiBearerAuth('access-token')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: 'Todo Create', description: 'Create a new todo' })
  @UseGuards(AuthGuard('admin', 'user'))
  @HttpCode(HttpStatus.OK)
  async createTodo(@Req() req: Request, @Body() createTodoDto: CreateTodoDto) {
    const result = await this.todoService.createTodo(
      req.user!.id,
      createTodoDto,
    );
    return {
      message: 'Todo created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Todo Find All',
    description: 'Find all user todos',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Search term for todo',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Title of the todo',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    description: 'Description of the todo',
  })
  @ApiQuery({
    name: 'isComplete',
    required: false,
    type: Boolean,
    description: 'Is complete of the todo',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit of the todo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page of the todo',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by of the todo',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order of the todo',
  })
  @UseGuards(AuthGuard('admin', 'user'))
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'description',
      'isComplete',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.todoService.findAll(
      req.user!.id,
      filters,
      options,
    );
    return {
      message: 'Todo found successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Todo Find One', description: 'Find one user todo' })
  @UseGuards(AuthGuard('admin', 'user'))
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const result = await this.todoService.findOne(req.user!.id, id);
    return {
      message: 'Todo found successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Todo Update', description: 'Update a user todo' })
  @UseGuards(AuthGuard('admin', 'user'))
  @HttpCode(HttpStatus.OK)
  async updateTodo(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    const result = await this.todoService.updateTodo(
      req.user!.id,
      id,
      updateTodoDto,
    );
    return {
      message: 'Todo updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Todo Delete', description: 'Delete a user todo' })
  @UseGuards(AuthGuard('admin', 'user'))
  @HttpCode(HttpStatus.OK)
  async removeTodo(@Req() req: Request, @Param('id') id: string) {
    const result = await this.todoService.removeTodo(req.user!.id, id);
    return {
      message: 'Todo deleted successfully',
      data: result,
    };
  }
}
