import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { ProcessPromptDto } from './ai-agent.dto';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post()
  async chatWithAIAgent(@Body() prompt: ProcessPromptDto): Promise<any> {
    return this.aiAgentService.processPrompt(prompt);
  }

  @Get()
  async get(@Body('prompt') prompt: string): Promise<string> {
    const datetime = new Date();
    console.log(datetime.toISOString().slice(0,10));
    return datetime.toISOString();
  }
}
