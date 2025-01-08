// src/tasks/tasks.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskTimeDto } from './tasks.dto';
import { UpdateTaskStatusDto } from './tasks.dto'; // Import the new DTO
import { Task, TaskDocument } from './tasks.schema';


@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) { }

  // Get all tasks
  async findAll(): Promise<Task[]> {
    return await this.taskModel.find().exec();
  }

  // Get tasks by User ID
  async findByUserId(userId: string): Promise<Task[]> {
    const tasks = await this.taskModel.find({ userId }).exec();
    if (!tasks.length) {
      return [];  
    }
    return tasks;
  }

  // Get a single task by ID
  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  // Create a new task
  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const newTask = new this.taskModel({
      ...createTaskDto,
    });
    return await newTask.save();
  }

  // Update an existing task
  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true, runValidators: true })
      .exec();
    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return updatedTask;
  }

  // Update the status of a task
  async updateTaskStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto): Promise<Task> {
    const { status } = updateTaskStatusDto;

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }, // runValidators ensures enum validation at the DB level
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  // Update the status of a task
  async updateTaskTime(id: string, updateTaskTimeDto: UpdateTaskTimeDto): Promise<Task> {
    const { startTime, endTime } = updateTaskTimeDto; // Use startTime and endTime from DTO
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        { startTime, endTime }, // Update startTime and endTime
        { new: true, runValidators: true }, // new: true returns the updated document
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }



  async incrementPomodoroNumber(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    

    if (task.pomodoro_number >= task.pomodoro_required_number) {
      task.status = 'completed';
    }

    return task.save();
  }

  async updateTaskTime(id: string, updateTaskTimeDto: UpdateTaskTimeDto): Promise<Task> {
    const { startTime, endTime } = updateTaskTimeDto; // Use startTime and endTime from DTO
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        { startTime, endTime }, // Update startTime and endTime
        { new: true, runValidators: true }, // new: true returns the updated document
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }
}
