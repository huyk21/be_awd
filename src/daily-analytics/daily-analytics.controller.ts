// daily-analytics.controller.ts
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DailyAnalyticsService } from './daily-analytics.service';

@Controller('daily-analytics')
export class DailyAnalyticsController {
  constructor(private readonly dailyAnalyticsService: DailyAnalyticsService) {}

  /**
   * Retrieves task counts grouped by status for a specific user within the current week.
   * @param user_id - The ID of the user.
   */
  @Get('circle-chart/:user_id')
  async getCircleChart(
    @Param('user_id') user_id: string,
  ) {
    return await this.dailyAnalyticsService.getCircleChartGroupByTaskStatus(user_id);
  }

  /**
   * Retrieves weekly task counts grouped by status for a specific user.
   * @param user_id - The ID of the user.
   */
  @Get('weekly/:user_id')
  async getWeeklyAnalytics(
    @Param('user_id') user_id: string,
  ) {
    return await this.dailyAnalyticsService.getWeeklyTaskCounts(user_id);
  }

  /**
   * Retrieves pomodoro analytics for a specific user within the current week.
   * @param user_id - The ID of the user.
   */
  @Get('pomodoro-analytics/:user_id')
  async getPomodoroAnalytics(
    @Param('user_id') user_id: string,
  ) {
    return await this.dailyAnalyticsService.getPomodoroAnalytics(user_id);
  }

  
}
