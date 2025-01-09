// daily-analytics.service.ts
import { Injectable, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../tasks/tasks.schema';
import { PomodoroLog } from '../focus-sessions/pomodoro.schema';
import { DailyAnalytics, DailyAnalyticsDocument } from './daily-analytics.schema';

@Injectable()
export class DailyAnalyticsService {
  private readonly logger = new Logger(DailyAnalyticsService.name);
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(PomodoroLog.name) private readonly pomodoroLogModel: Model<typeof PomodoroLog>,
    @InjectModel(DailyAnalytics.name) private readonly dailyAnalyticsModel: Model<DailyAnalyticsDocument>,
  ) {}

  // Existing methods updated to accept user_id
  async getCircleChartGroupByTaskStatus(userId: string): Promise<{ [status: string]: number }> {
    this.logger.debug(`getCircleChartGroupByTaskStatus called with userId: ${userId}`);
  
    if (!userId) {
      this.logger.error('User ID is missing in getCircleChartGroupByTaskStatus');
      throw new BadRequestException('User ID is required');
    }
  
    const { sunday, saturday } = this.getSundayAndSaturdayOfThisWeek();
    this.logger.debug(`Aggregating tasks from ${sunday.toISOString()} to ${saturday.toISOString()}`);
  
    try {
      const results = await this.taskModel.aggregate([
        {
          $match: {
            userId: userId, // Filter by userId
            startTime: { $gte: sunday, $lte: saturday },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
  
      this.logger.debug(`Aggregation Results: ${JSON.stringify(results)}`);
  
      const taskCounts = results.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});
  
      // Validate that all expected statuses are present
      const expectedStatuses = ['completed', 'in-progress', 'pending', 'expired'];
      expectedStatuses.forEach(status => {
        if (!(status in taskCounts)) {
          taskCounts[status] = 0;
          this.logger.warn(`Status "${status}" missing in aggregation results. Defaulting to 0.`);
        }
      });
  
      this.logger.debug(`Processed Task Counts: ${JSON.stringify(taskCounts)}`);
  
      return taskCounts;
    } catch (error) {
      this.logger.error(`Error in getCircleChartGroupByTaskStatus for userId: ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to aggregate task statuses.');
    }
  }
  

  async getPomodoroAnalytics(userId: string): Promise<{
    weeklyPomodoro: { [date: string]: number };
    activeDays: number;
    totalTimeSpent: number; // Total time spent in minutes for pomodoro sessions
  }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { sunday, saturday } = this.getSundayAndSaturdayOfThisWeek();

    // Aggregate tasks for weekly pomodoro count
    const taskResults = await this.taskModel.aggregate([
      {
        $match: {
          userId: userId, // Filter by userId
          startTime: { $gte: sunday, $lte: saturday },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalPomodoro: { $sum: '$pomodoro_number' },
        },
      },
    ]);

    const weeklyPomodoro: { [date: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(sunday);
      currentDate.setDate(sunday.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      weeklyPomodoro[dateString] = 0;
    }

    taskResults.forEach((result) => {
      weeklyPomodoro[result._id] = result.totalPomodoro;
    });

    // Aggregate pomodoro logs for total time spent
    const timeSpentResult = await this.pomodoroLogModel.aggregate([
      {
        $match: {
          userId: userId, // Filter by userId
          start_time: { $gte: sunday, $lte: saturday },
          session_status: 'pomodoro', // Filter by session_status = 'pomodoro'
        },
      },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$end_time', '$start_time'] },
              1000 * 60, // Convert milliseconds to minutes
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTimeSpent: { $sum: '$duration' },
        },
      },
    ]);

    const totalTimeSpent = timeSpentResult.length
      ? timeSpentResult[0].totalTimeSpent
      : 0;

    const activeDays = Object.values(weeklyPomodoro).filter(
      (pomodoro) => pomodoro >= 1,
    ).length;

    return { weeklyPomodoro, activeDays, totalTimeSpent };
  }

  async getWeeklyTaskCounts(userId: string): Promise<{ [status: string]: number }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const results = await this.taskModel.aggregate([
      {
        $match: {
          userId: userId, // Filter by userId
          startTime: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const weeklyCounts = results.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return weeklyCounts;
  }

  async updateSessionSettings(userId: string, settings: any): Promise<any> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Example: Update settings in DailyAnalytics collection
    const updated = await this.dailyAnalyticsModel.findOneAndUpdate(
      { userId: userId, date: this.getTodayDateString() }, // Match by userId and today's date
      settings, // Update with provided settings
      { new: true, upsert: true }, // Return the updated document or create if not exists
    );

    return updated;
  }

  // Helper method to get today's date as string
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }

  getSundayAndSaturdayOfThisWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Sunday (start of the week)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0); // Set time to the start of the day

    // Calculate Saturday (end of the week)
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999); // Set time to the end of the day

    return { sunday, saturday };
  }
}
