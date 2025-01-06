import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { TasksModule } from '../tasks/tasks.module';
import { IntentCategorizerService } from './intent-categorizer.service';

@Module({
  providers: [AiAgentService, IntentCategorizerService],
  controllers: [AiAgentController],
  imports: [TasksModule],
})
export class AiAgentModule {}
