// src/ai-agent/dto/process-prompt.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProcessPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userRole: string;

  @IsString()
  @IsOptional() // Model is optional
  preferredModel?: string;
}