import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('api/webhook')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    this.logger.debug('Received webhook request');

    const payload = req.body; // Raw payload as Buffer
    const headers = req.headers;

    // Confirm payload type
    this.logger.debug(`Payload type: ${typeof payload}`);
    if (Buffer.isBuffer(payload)) {
      this.logger.debug('Payload is a Buffer');
    } else {
      this.logger.error('Payload is not a Buffer. Ensure raw body parser is applied.');
    }

    try {
      await this.webhooksService.handleWebhook(payload, headers as Record<string, string>);
      res.status(200).send('Webhook processed successfully');
    } catch (err) {
      this.logger.error(`Webhook processing failed: ${err.message}`, err.stack);
      res.status(400).send('Webhook Error');
    }
  }
}
