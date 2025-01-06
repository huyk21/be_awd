import { GoogleGenerativeAI } from '@google/generative-ai';
import { Inject, Injectable } from '@nestjs/common';
import {
  deleteTaskByIdFunctionDeclaration,
  createTaskFunctionDeclaration,
  findAllTasksFunctionDeclaration,
} from './ai-agent.config';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class AiAgentService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly generativeModel: any;
  // buffer for caching user tasks
  private userTasks: any;
  private userId: string = 'user_2q3NRZRd97Bd1pj5ecvlyLiMmIT';

  private functions = {
    findAllTasksByUserId: async ({ userId }) => {
      console.log(`Fetching tasks for userId: ${userId}`);
      return await this.tasksService.findByUserId(userId);
    },
    deleteTaskById: async ({ taskId }) => {
      return await this.tasksService.deleteTask(taskId);
    },
    createTask: async (data: any) => {
      return await this.tasksService.createTask(data);
    },
  };

  constructor(
    @Inject(TasksService) private readonly tasksService: TasksService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.generativeModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'You will be provided a tasks data of users as a knowledgebase',
      tools: {
        functionDeclarations: [
          //   findAllTasksFunctionDeclaration,
          deleteTaskByIdFunctionDeclaration,
          createTaskFunctionDeclaration,
        ],
      },
      toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    });
  }

  async processPrompt(prompt: string) {
    // this will pass by middleware jwt token
    const userId = 'user_2q3NRZRd97Bd1pj5ecvlyLiMmIT';
    if (!this.userTasks) {
      this.userTasks = await this.tasksService.findByUserId(userId);
    }
    const chat = this.generativeModel.startChat({
      history: [
        {
          role: 'user',
          parts: [
            {
              text: `This is the knowledge base ${this.userTasks} and today is ${new Date().toISOString()}`,
            },
            {
              text: 'This is my user_id' + this.userId,
            },
          ],
        },
      ],
    });
    const result = await chat.sendMessage(prompt);
    const call = result.response.functionCalls();
    console.log(call);
    if (call) {
      if (this.functions[call[0].name]) {
        if (call[0].name === 'deleteTaskById') {
          console.log('delete call', call);
          let deletedCount = 0;
          for (const call_element of call) {
            const response = await this.functions[call_element.name](
              call_element.args,
            );
            deletedCount += 1;
          }
          return `deleted ${deletedCount} tasks`;
          // will call to delete selected tasks
        }
        if (call[0].name === 'createTask') {
          // const apiResponse = await this.functions[call.name](call.args);
          let countCreate = 0;
          const listTaskCreated = [];
          for (const call_element of call) {
            const response = await this.functions[call_element.name](
              call_element.args,
            );
            listTaskCreated.push(response);
            countCreate += 1;
          }
          return listTaskCreated;
        }
      } else {
        throw new Error(`Function ${call.name} is not implemented.`);
      }
    } else {
      throw new Error('No function call detected.');
    }
  }
}
