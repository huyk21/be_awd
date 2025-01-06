import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post()
  async testAiAgent(@Body('prompt') prompt: string): Promise<any> {
    return this.aiAgentService.processPrompt(prompt);
  }

  @Get()
  async get(@Body('prompt') prompt: string): Promise<string> {
    const datetime = new Date();
    console.log(datetime.toISOString().slice(0,10));
    return datetime.toISOString();
  }
}
