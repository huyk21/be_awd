// daily-analytics.module.ts
import { Module } from '@nestjs/common';
import { DailyAnalyticsController } from './daily-analytics.controller';
import { DailyAnalyticsService } from './daily-analytics.service';
import { TasksModule } from '../tasks/tasks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PomodoroLog, PomodoroLogSchema } from '../focus-sessions/pomodoro.schema';
import { DailyAnalytics, DailyAnalyticsSchema } from './daily-analytics.schema';

@Module({
  controllers: [DailyAnalyticsController],
  providers: [DailyAnalyticsService],
  imports: [
    MongooseModule.forFeature([
      { name: PomodoroLog.name, schema: PomodoroLogSchema },
      { name: DailyAnalytics.name, schema: DailyAnalyticsSchema }, // Register DailyAnalytics schema
    ]),
    TasksModule, // Import TasksModule to access TaskModel
  ],
})
export class DailyAnalyticsModule {}
