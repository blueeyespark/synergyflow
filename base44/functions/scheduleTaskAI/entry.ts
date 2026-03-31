import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, projectId, priority, dueDate, assignedTo, status } = await req.json();

    if (!title) {
      return Response.json({ error: 'Task title required' }, { status: 400 });
    }

    // Create the task
    const task = await base44.entities.Task.create({
      title,
      description: description || '',
      project_id: projectId || '',
      priority: priority || 'medium',
      due_date: dueDate || '',
      assigned_to: assignedTo || '',
      status: status || 'todo',
    });

    // If assigned, send notification
    if (assignedTo) {
      await base44.entities.Notification.create({
        user_email: assignedTo,
        type: 'task_assigned',
        title: `New task assigned: ${title}`,
        message: description ? `${description.substring(0, 100)}...` : 'Check it out!',
        task_id: task.id,
        project_id: projectId,
        is_read: false,
      });
    }

    return Response.json({
      success: true,
      task,
      message: `Task "${title}" created and ${assignedTo ? 'assigned to ' + assignedTo : 'scheduled'}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});