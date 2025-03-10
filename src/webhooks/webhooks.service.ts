import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Webhook } from 'svix';
import { User, UserDocument } from '../users/users.schema';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async handleWebhook(payload: Buffer, headers: Record<string, string>): Promise<void> {
    this.logger.debug('Starting webhook handling');
  
    try {
      if (!process.env.CLERK_WEBHOOK_SECRET_KEY) {
        this.logger.error('CLERK_WEBHOOK_SECRET_KEY is not set');
        throw new Error('Webhook secret key is missing');
      }
  
      const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY);
  
      // Debug payload and headers
      this.logger.debug(`Payload (raw): ${payload.toString('utf8')}`);
      this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
  
      const evt = wh.verify(payload.toString(), headers) as {
        type: string;
        data: { id: string; first_name?: string; last_name?: string };
      };
  
      const { id, first_name, last_name } = evt.data;
      const eventType = evt.type;
  
      this.logger.debug(`Webhook verified. Event type: ${eventType}`);
      this.logger.debug(`Event data: ${JSON.stringify(evt.data)}`);
  
      if (eventType === 'user.created') {
        await this.createUser(id, first_name, last_name);
      } else {
        this.logger.warn(`Unhandled event type: ${eventType}`);
      }
    } catch (err) {
      this.logger.error(`Error handling webhook: ${err.message}`, err.stack);
      throw new Error(`Webhook processing failed: ${err.message}`);
    }
  }
  
  

  private async createUser(id: string, firstName?: string, lastName?: string): Promise<void> {
    this.logger.debug(`Creating user with ID: ${id}`);
    
    try {
      const existingUser = await this.userModel.findOne({ userId: id });

      if (existingUser) {
        this.logger.log(`User ${id} already exists. Skipping creation.`);
        return;
      }

      const defaultSettings = {
        theme: 'light',
        notifications: true,
        language: 'en',
      };

      const user = new this.userModel({
        userId: id,
        tasks: [], // Default to an empty array
        settings: defaultSettings,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      });

      await user.save();
      this.logger.log(`User ${id} successfully saved to the database.`);
    } catch (err) {
      this.logger.error(`Error creating user ${id}: ${err.message}`, err.stack);
      throw new Error(`User creation failed: ${err.message}`);
    }
  }
}
