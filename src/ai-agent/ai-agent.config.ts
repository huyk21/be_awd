// function declaration
export const findAllTasksFunctionDeclaration = {
  name: 'findAllTasksByUserId',
  description: 'Find all tasks by userId',
  parameters: {
    type: 'object',
    description: 'Find all tasks by userId',
    properties: {
      userId: {
        type: 'string',
        description: 'userId to get tasks',
      },
    },
    required: ['userId'],
  },
};

export const deleteTaskByIdFunctionDeclaration = {
  name: 'deleteTaskById',
  description: 'Delete task id',
  parameters: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
      },
    },
    required: ['taskId'],
  },
};

export const createTaskFunctionDeclaration = {
  name: 'createTask',
  description: 'Create a new task.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The ID of the user creating the task.',
      },
      title: { type: 'string', description: 'The title of the task.' },
      description: {
        type: 'string',
        description: 'A description of the task.',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in-progress', 'completed', 'expired'],
        description:
          'The status of the task. enum(pending, in-progress, completed, expired)',
      },
      priority: {
        type: 'string',
        description: 'The priority of the task. enum(low, medium, high)',
      },
      category: { type: 'string', description: 'The category of the task.' },
      startTime: { type: 'string', description: 'The start time of the task.' },
      endTime: { type: 'string', description: 'The end time of the task.' },
      estimatedTime: {
        type: 'integer',
        description: 'The estimated time to complete the task in minutes.',
      },
      pomodoro_required_number: {
        type: 'integer',
        description: 'The number of pomodoros required for the task.',
      },
      pomodoro_number: {
        type: 'integer',
        description: 'The current pomodoro number.',
      },
      is_on_pomodoro_list: {
        type: 'boolean',
        description: 'Whether the task is on the pomodoro list.',
      },
      style: {
        type: 'object',
        description: 'Styling information for the task.',
        properties: {
          backgroundColor: {
            type: 'string',
            description: 'The background color.',
          },
          textColor: { type: 'string', description: 'The text color.' },
        },
      },
    },
    required: [
      'userId',
      'title',
      'status',
      'priority',
      'startTime',
      'endTime',
      'estimatedTime',
    ], // These fields are mandatory
  },
};
