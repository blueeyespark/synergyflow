// Check if a task is blocked by incomplete dependencies
export function isTaskBlocked(task, allTasks = []) {
  if (!task.depends_on || task.depends_on.length === 0) {
    return { isBlocked: false, blockedBy: [] };
  }

  const blockedBy = task.depends_on
    .map(depId => allTasks.find(t => t.id === depId))
    .filter(t => t && t.status !== 'completed');

  return {
    isBlocked: blockedBy.length > 0,
    blockedBy: blockedBy.map(t => ({ id: t.id, title: t.title }))
  };
}

// Check if task can transition to a new status
export function canChangeTaskStatus(task, newStatus, allTasks = []) {
  // If transitioning to completed, check dependencies
  if (newStatus === 'completed') {
    const { isBlocked } = isTaskBlocked(task, allTasks);
    if (isBlocked) {
      return {
        allowed: false,
        reason: 'Cannot complete: task has incomplete dependencies'
      };
    }
  }
  return { allowed: true };
}

// Get all tasks blocked by a specific task
export function getTasksDependentOn(taskId, allTasks = []) {
  return allTasks.filter(t => t.depends_on && t.depends_on.includes(taskId));
}