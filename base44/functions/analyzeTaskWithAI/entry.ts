import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskTitle, taskDescription, projectId } = await req.json();

    if (!taskTitle) {
      return Response.json({ error: 'Task title required' }, { status: 400 });
    }

    // Get user's completed tasks for historical analysis
    const completedTasks = await base44.entities.Task.filter(
      { status: 'completed', assigned_to: user.email },
      '-completed_at',
      50
    );

    // Calculate average completion times by priority
    const timesByPriority = {
      low: [],
      medium: [],
      high: [],
      urgent: []
    };

    for (const task of completedTasks) {
      if (!task.start_date || !task.completed_at) continue;
      const days = Math.ceil(
        (new Date(task.completed_at) - new Date(task.start_date + 'T00:00:00')) / (1000 * 60 * 60 * 24)
      );
      if (timesByPriority[task.priority]) {
        timesByPriority[task.priority].push(days);
      }
    }

    const avgTimes = {};
    Object.entries(timesByPriority).forEach(([priority, times]) => {
      avgTimes[priority] = times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b) / times.length)
        : null;
    });

    // Use LLM to analyze task
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task management AI assistant. Analyze this task and provide structured suggestions.

Task Title: ${taskTitle}
Task Description: ${taskDescription || 'No description provided'}

Historical task completion times for this user:
- Low priority tasks: ${avgTimes.low ? avgTimes.low + ' days' : 'No data'}
- Medium priority tasks: ${avgTimes.medium ? avgTimes.medium + ' days' : 'No data'}
- High priority tasks: ${avgTimes.high ? avgTimes.high + ' days' : 'No data'}
- Urgent priority tasks: ${avgTimes.urgent ? avgTimes.urgent + ' days' : 'No data'}

Provide analysis in this JSON format (only JSON, no other text):
{
  "suggestedPriority": "low|medium|high|urgent",
  "priorityReason": "brief reason (max 20 words)",
  "estimatedDays": number,
  "estimationReason": "brief reason (max 20 words)",
  "subtasks": [
    {"title": "subtask 1", "description": "brief description"},
    {"title": "subtask 2", "description": "brief description"},
    {"title": "subtask 3", "description": "brief description"}
  ],
  "tips": "brief actionable tip (max 30 words)"
}`,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          suggestedPriority: { type: 'string' },
          priorityReason: { type: 'string' },
          estimatedDays: { type: 'number' },
          estimationReason: { type: 'string' },
          subtasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          tips: { type: 'string' }
        }
      }
    });

    return Response.json(analysis);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});