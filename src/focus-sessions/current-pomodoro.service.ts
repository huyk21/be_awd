import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CurrentPomodoroSchema, CurrentPomodoro } from './pomodoro.schema';
import { UpdateCurrentPomodoroDto } from './update-current-pomodoro.dto';

@Injectable()
export class CurrentPomodoroService {
  constructor(
    @InjectModel('CurrentPomodoro')
    private readonly currentPomodoroModel: Model<any>,
  ) {}

  // Create a new CurrentPomodoro record
  async createCurrentPomodoro(data: {
    user_id: string;
    number_start: number;
    cycles_completed: number;
    total_break_time: number; // in seconds
    number_sessions: number;
  }) {
    const newPomodoro = new this.currentPomodoroModel(data);
    return newPomodoro.save();
  }

  // Update an existing CurrentPomodoro record by user_id
  async updateCurrentPomodoro(user_id: string, data: Partial<any>) {
    return this.currentPomodoroModel.findOneAndUpdate({ user_id }, data, {
      new: true,
      upsert: true, // Creates a new record if no match is found
    });
  }
  async updateOrCreateCurrentPomodoro(user_id: string, updateData: UpdateCurrentPomodoroDto): Promise<typeof CurrentPomodoro> {
    try {
      const updatedPomodoro = await this.currentPomodoroModel.findOneAndUpdate(
        { user_id },
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).exec();

      return updatedPomodoro;
    } catch (error) {
      throw error; // Handle or log the error as needed
    }
  }
  // Find all CurrentPomodoro records
  async findAllCurrentPomodoros() {
    return this.currentPomodoroModel.find().populate('user_id').exec();
  }

  // Find a specific CurrentPomodoro record by user_id
  async findCurrentPomodoroByUserId(user_id: string) {
    return this.currentPomodoroModel
      .findOne({ user_id })
      .populate('user_id')
      .exec();
  }

  // Delete a specific CurrentPomodoro record by user_id
  async deleteCurrentPomodoroByUserId(user_id: string) {
    return this.currentPomodoroModel.findOneAndDelete({ user_id }).exec();
  }
}
