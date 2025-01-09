import {
  GoogleGenerativeAI,
  GenerativeModel,
  FunctionCallingMode,
} from '@google/generative-ai';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  deleteTaskByIdFunctionDeclaration,
  createTaskFunctionDeclaration,
  chatWithUserFunctionDeclaration,
  generationConfig,
} from './ai-agent.config';
import { TasksService } from '../tasks/tasks.service';
import { ProcessPromptDto } from './ai-agent.dto';

const tools = [
  deleteTaskByIdFunctionDeclaration,
  createTaskFunctionDeclaration,
  chatWithUserFunctionDeclaration,
];
@Injectable()
export class AiAgentService {
  private readonly genAI;
  private readonly generativeModel: object;
  private cacheUserTasks: Map<string, any[]> = new Map(); // Cache for user tasks
  private chatSessions: Map<string, any> = new Map();

  private functions = {
    findAllTasksByUserId: async ({ userId }): Promise<any> => {
      console.log(`Fetching tasks for userId: ${userId}`);
      return await this.tasksService.findByUserId(userId);
    },
    deleteTaskById: async ({ taskId }) => {
      return await this.tasksService.deleteTask(taskId);
    },
    createTask: async (data: any) => {
      return await this.tasksService.createTask(data);
    },
    answerUserQuestion: (data: any) => {
      return data;
    },
  };

  constructor(
    @Inject(TasksService) private readonly tasksService: TasksService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelParams = {
      model: 'gemini-1.5-flash',
      systemInstruction:
        'You will be provided a tasks data of users as a knowledgebase. You are an ai-agent that answer user question.',
      tools: {functionDeclarations: tools},
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    };
    this.generativeModel = this.genAI.getGenerativeModel(modelParams);
  }

  async processPrompt(payload: ProcessPromptDto) {
    const { userId, userRole, prompt } = payload;

    // User role check (can be modified as needed)
    if (userRole !== 'premium') {
      throw new UnauthorizedException(
        'Please upgrade to premium to use this feature',
      );
    }

    // Fetch or retrieve user tasks from cache
    let userTasks;
    const cachedTasks = this.cacheUserTasks.get(userId);
    if (!cachedTasks) {
      const fetchedTasks = await this.tasksService.findByUserId(userId);
      userTasks = fetchedTasks;
      this.cacheUserTasks.set(userId, fetchedTasks);
    } else {
      userTasks = cachedTasks;
    }

    let chatSession = await this.chatSessions.get(userId);

    if (!chatSession) {
      console.log('user not have chat session', chatSession);
      chatSession = (this.generativeModel as GenerativeModel).startChat({
        history: [
          {
            role: 'user',
            parts: [
              {
                text: `This is the knowledge base that is my tasks:${userTasks}. today is ${new Date().toISOString()}`,
              },
              { text: 'This is my user_id' + userId },
            ],
          },
        ],
        generationConfig,
      });
      this.chatSessions.set(userId, chatSession);
    } else {
    }
    console.log(userTasks, chatSession);

    const result = await chatSession.sendMessage(prompt);
    const calls = result.response.functionCalls();

    if (!calls || calls.length === 0) {
      return {
        response: result.response.text() || 'No response from the model.',
      }; // Handle no function calls
    }

    const functionName = calls[0].name;

    if (!this.functions[functionName]) {
      throw new Error(`Function ${functionName} is not implemented.`);
    }

    let responseMessage;

    switch (functionName) {
      case 'deleteTaskById':
        try {
          const deletePromises = calls.map((call) =>
            this.functions[call.name](call.args),
          );
          const results = await Promise.all(deletePromises);
          const deletedCount = results.length; // Count successful deletions

          // Update user tasks in cache and chat session
          responseMessage = `I deleted ${deletedCount} tasks`;
          await chatSession.sendMessage(`You have deleted ${deletedCount} tasks`);
        } catch (error) {
          console.error('Error deleting tasks:', error);
          responseMessage = 'An error occurred while deleting tasks.';
        }
        break;

      case 'createTask':
        try {
          const createPromises = calls.map((call) =>
            this.functions[call.name](call.args),
          );
          const createdTasks = await Promise.all(createPromises);

          // Update user tasks in cache and chat session
          userTasks.concat(createdTasks);
          console.log('tasks after update', userTasks);
          this.cacheUserTasks.set(userId, userTasks);
          await chatSession.sendMessage(`This is my new addded task ${createdTasks}`);

          responseMessage = `I have created ${createdTasks.length} tasks`;
        } catch (error) {
          console.error('Error creating tasks:', error);
          responseMessage = 'An error occurred while creating tasks.';
        }
        break;

      case 'answerUserQuestion':
        responseMessage =
          calls[0].args.response || "I can't answer your question.";
        break;

      default:
        throw new Error(`Unexpected function call: ${functionName}`);
    }

    this.chatSessions.set(userId, chatSession); // Update chat session with potential history changes
    return { response: responseMessage };
  }
}
