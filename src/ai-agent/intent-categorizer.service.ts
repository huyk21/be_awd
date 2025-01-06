import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentCategorizerService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly categorizeModel: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.categorizeModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  async categorizeIntent(userInput: string): Promise<string> {
    const response = await this.categorizeModel.generateContent({
      prompt: `Classify this input into one of the following actions: create_task, delete_task, find_tasks, chat.\n\nInput: ${userInput}\n\nAction:`,
    });

    return response.text.trim();
  }
}
