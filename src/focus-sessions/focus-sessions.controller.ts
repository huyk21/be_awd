// src/controllers/focus-sessions.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  Delete,
} from '@nestjs/common';
import { SessionSettingsService } from './session-settings.service';
import { CurrentPomodoroService } from './current-pomodoro.service';
import { TasksService } from '../tasks/tasks.service';
import { PomodoroLogService } from './pomodoro-log.service';

@Controller('focus-sessions')
export class FocusSessionsController {
  private readonly logger = new Logger(FocusSessionsController.name);

  constructor(
    private readonly sessionSettingsService: SessionSettingsService,
    private readonly currentPomodoroService: CurrentPomodoroService,
    private readonly pomodoroLogService: PomodoroLogService,
    private readonly taskService: TasksService,
  ) {}

  /**
   * Create session settings for a user.
   */
  @Post('session-settings')
  async createSessionSettings(@Body() body: any) {
    this.logger.debug(`Received POST /focus-sessions/session-settings with body: ${JSON.stringify(body)}`);

    const {
      user_id,
      default_work_time,
      default_break_time,
      long_break_time,
      cycles_per_set,
    } = body;

    if (!user_id) {
      this.logger.warn('User ID is missing in the request body.');
      throw new HttpException('User ID is required.', HttpStatus.BAD_REQUEST);
    }

    try {
      const settings = await this.sessionSettingsService.createSessionSettings(user_id, {
        default_work_time,
        default_break_time,
        long_break_time,
        cycles_per_set,
      });
      this.logger.debug(`Session settings created for user_id: ${user_id}`);
      return settings;
    } catch (error) {
      this.logger.error(`Error creating session settings for user_id: ${user_id}`, error.stack);
      throw new HttpException('Failed to create session settings.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update session settings for a user.
   */
  @Put('update/:user_id')
  async updateSessionSettings(@Param('user_id') user_id: string, @Body() body: any) {
    this.logger.debug(`Received PUT /focus-sessions/update/${user_id} with body: ${JSON.stringify(body)}`);

    const {
      default_work_time,
      default_break_time,
      long_break_time,
      cycles_per_set,
    } = body;

    if (!user_id) {
      this.logger.warn('User ID is missing in the URL parameters.');
      throw new HttpException('User ID is required.', HttpStatus.BAD_REQUEST);
    }

    try {
      const updatedSettings = await this.sessionSettingsService.updateSessionSettings(user_id, {
        default_work_time,
        default_break_time,
        long_break_time,
        cycles_per_set,
      });
      this.logger.debug(`Session settings updated for user_id: ${user_id}`);
      return updatedSettings;
    } catch (error) {
      this.logger.error(`Error updating session settings for user_id: ${user_id}`, error.stack);
      throw new HttpException('Failed to update session settings.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get session settings for the authenticated user.
   */
  @Get('session-settings')
  async getSessionSettings(@Request() req) {
    this.logger.debug('Received GET /focus-sessions/session-settings');

    const userId = req['user']?.userId;
    this.logger.debug(`Authenticated user ID: ${userId}`);

    if (!userId) {
      this.logger.warn('User ID not found in the request.');
      throw new HttpException('User not authenticated.', HttpStatus.UNAUTHORIZED);
    }

    try {
      const settings = await this.sessionSettingsService.findByUserId(userId);
      if (!settings) {
        this.logger.warn(`Session settings not found for user_id: ${userId}`);
        throw new HttpException('Session settings not found.', HttpStatus.NOT_FOUND);
      }

      this.logger.debug(`Retrieved session settings for user_id: ${userId}`);
      return settings;
    } catch (error) {
      this.logger.error(`Error fetching session settings for user_id: ${userId}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch session settings.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a pomodoro log entry.
   */
  @Post('pomodoro-log')
  async createPomodoroLog(@Body() body: any) {
    this.logger.debug(`Received POST /focus-sessions/pomodoro-log with body: ${JSON.stringify(body)}`);

    let {
      user_id,
      task_id,
      current_pomodoro_number,
      current_cycle_number,
      required_cyle_number,
      start_time,
      end_time,
      session_status,
    } = body;

    if (!user_id || !task_id || !session_status) {
      this.logger.warn('Missing required fields in the pomodoro log request.');
      throw new HttpException('Missing required fields.', HttpStatus.BAD_REQUEST);
    }

    try {
      // Create pomodoro log
      await this.pomodoroLogService.create({
        user_id,
        task_id,
        start_time,
        end_time,
        session_status,
      });
      this.logger.debug(`Pomodoro log created for user_id: ${user_id}, task_id: ${task_id}`);

      // Update session status based on the current session
      if (session_status === 'pomodoro') {
        await this.taskService.incrementPomodoroNumber(task_id);
        this.logger.debug(`Incremented pomodoro number for task_id: ${task_id}`);
        current_pomodoro_number += 1;

        if (current_pomodoro_number === required_cyle_number) {
          session_status = 'long-break';
          this.logger.debug('Session status updated to long-break');
        } else {
          session_status = 'short-break';
          this.logger.debug('Session status updated to short-break');
        }
      } else if (session_status === 'short-break') {
        session_status = 'short-break';
        current_cycle_number += 1;
        this.logger.debug('Session status remains short-break');
      } else if (session_status === 'long-break') {
        session_status = 'pomodoro';
        current_cycle_number = 1;
        this.logger.debug('Session status updated to pomodoro');
      }

      // Update CurrentPomodoro
      const currentPomodoro = await this.currentPomodoroService.findCurrentPomodoroByUserId(user_id);
      if (!currentPomodoro) {
        this.logger.warn(`CurrentPomodoro not found for user_id: ${user_id}`);
        throw new HttpException('CurrentPomodoro not found.', HttpStatus.NOT_FOUND);
      }

      currentPomodoro.current_pomodoro_number = current_pomodoro_number;
      currentPomodoro.current_cycle_number = current_cycle_number;
      currentPomodoro.current_session_status = session_status;

      await currentPomodoro.save();
      this.logger.debug(`CurrentPomodoro updated for user_id: ${user_id}`);

      return {
        user_id,
        task_id,
        current_pomodoro_number,
        current_cycle_number,
        required_cyle_number,
        start_time,
        end_time,
        session_status,
        message: 'successfully',
      };
    } catch (error) {
      this.logger.error(`Error creating pomodoro log for user_id: ${user_id}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create pomodoro log.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create or initialize CurrentPomodoro for a user.
   */
  @Post('/current-pomodoro')
  async createCurrentPomodoro(@Body() data: any) {
    this.logger.debug(`Received POST /focus-sessions/current-pomodoro with data: ${JSON.stringify(data)}`);

    if (!data.user_id) {
      this.logger.warn('User ID is missing in the current pomodoro request.');
      throw new HttpException('User ID is required.', HttpStatus.BAD_REQUEST);
    }

    try {
      const currentPomodoro = await this.currentPomodoroService.createCurrentPomodoro(data);
      this.logger.debug(`CurrentPomodoro created for user_id: ${data.user_id}`);
      return currentPomodoro;
    } catch (error) {
      this.logger.error(`Error creating CurrentPomodoro for user_id: ${data.user_id}`, error.stack);
      throw new HttpException('Failed to create CurrentPomodoro.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieve all pomodoro logs.
   */
  @Get('/pomodoro-log')
  async getPomodoroLog() {
    this.logger.debug('Received GET /focus-sessions/pomodoro-log');

    try {
      const logs = await this.pomodoroLogService.findAll();
      this.logger.debug(`Retrieved ${logs.length} pomodoro logs`);
      return logs;
    } catch (error) {
      this.logger.error('Error fetching pomodoro logs', error.stack);
      throw new HttpException('Failed to fetch pomodoro logs.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
   /**
   * Update a CurrentPomodoro record by user_id.
   */
   @Put('current-pomodoro/:user_id')
   async updateCurrentPomodoro(
     @Param('user_id') user_id: string,
     @Body() body: any,
   ) {
     this.logger.debug(
       `Received PUT /focus-sessions/current-pomodoro/${user_id} with body: ${JSON.stringify(body)}`,
     );
 
     // Validate input
     if (!user_id) {
       this.logger.warn('User ID is missing in the URL parameters.');
       throw new HttpException('User ID is required.', HttpStatus.BAD_REQUEST);
     }
 
     try {
       const updatedPomodoro = await this.currentPomodoroService.updateCurrentPomodoro(
         user_id,
         body, // Expecting partial CurrentPomodoro data
       );
 
       this.logger.debug(
         `CurrentPomodoro updated for user_id: ${user_id}`,
       );
 
       return {
         message: 'CurrentPomodoro updated successfully.',
         data: updatedPomodoro,
       };
     } catch (error) {
       this.logger.error(
         `Error updating CurrentPomodoro for user_id: ${user_id}`,
         error.stack,
       );
       if (error instanceof HttpException) {
         throw error;
       }
       throw new HttpException(
         'Failed to update CurrentPomodoro.',
         HttpStatus.INTERNAL_SERVER_ERROR,
       );
     }
   }
 
   /**
    * Delete a CurrentPomodoro record by user_id.
    */
   @Delete('current-pomodoro/:user_id')
   async deleteCurrentPomodoro(
     @Param('user_id') user_id: string,
   ) {
     this.logger.debug(
       `Received DELETE /focus-sessions/current-pomodoro/${user_id}`,
     );
 
     // Validate input
     if (!user_id) {
       this.logger.warn('User ID is missing in the URL parameters.');
       throw new HttpException('User ID is required.', HttpStatus.BAD_REQUEST);
     }
 
     try {
       const deletedPomodoro = await this.currentPomodoroService.deleteCurrentPomodoroByUserId(user_id);
 
       if (!deletedPomodoro) {
         this.logger.warn(`CurrentPomodoro not found for user_id: ${user_id}`);
         throw new HttpException('CurrentPomodoro not found.', HttpStatus.NOT_FOUND);
       }
 
       this.logger.debug(
         `CurrentPomodoro deleted for user_id: ${user_id}`,
       );
 
       return {
         message: 'CurrentPomodoro deleted successfully.',
         data: deletedPomodoro,
       };
     } catch (error) {
       this.logger.error(
         `Error deleting CurrentPomodoro for user_id: ${user_id}`,
         error.stack,
       );
       if (error instanceof HttpException) {
         throw error;
       }
       throw new HttpException(
         'Failed to delete CurrentPomodoro.',
         HttpStatus.INTERNAL_SERVER_ERROR,
       );
     }
   }
}
