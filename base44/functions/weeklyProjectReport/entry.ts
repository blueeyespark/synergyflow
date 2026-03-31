import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled invocation (no user auth needed for scheduled calls)
    const projects = await base44.asServiceRole.entities.Project.list();
    const tasks = await base44.asServiceRole.entities.Task.list();
    const timeEntries = await base44.asServiceRole.entities.TimeEntry.list();
    const budgetEntries = await base44.asServiceRole.entities.Budget.list();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const project of projects) {
      if (!project.owner_email) continue;

      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const completedThisWeek = projectTasks.filter(t =>
        t.status === 'completed' &&
        t.completed_at &&
        new Date(t.completed_at) >= oneWeekAgo
      );

      const projectEntries = timeEntries.filter(e =>
        e.project_id === project.id &&
        e.duration_seconds > 0 &&
        e.start_time &&
        new Date(e.start_time) >= oneWeekAgo
      );

      const totalSeconds = projectEntries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
      const totalHours = (totalSeconds / 3600).toFixed(1);
      const billableAmount = projectEntries
        .filter(e => e.is_billable)
        .reduce((s, e) => s + ((e.duration_seconds / 3600) * (e.hourly_rate || 0)), 0);

      const projectBudget = budgetEntries.filter(e => e.project_id === project.id);
      const totalIncome = projectBudget.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const totalExpenses = projectBudget.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const budgetUtil = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(0) : 'N/A';

      const completedList = completedThisWeek.map(t => `  • ${t.title}`).join('\n') || '  (none this week)';

      const subject = `📊 Weekly Report: ${project.name} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      const body = `Hi there,

Here's your weekly project summary for "${project.name}":

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASKS COMPLETED THIS WEEK (${completedThisWeek.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${completedList}

Total tasks in project: ${projectTasks.length}
Completed overall: ${projectTasks.filter(t => t.status === 'completed').length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱ TIME TRACKED THIS WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total hours logged: ${totalHours}h
Billable amount:    $${billableAmount.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 BUDGET UTILIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total income:    $${totalIncome.toLocaleString()}
Total expenses:  $${totalExpenses.toLocaleString()}
Utilization:     ${budgetUtil}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Have a great week!
— Planify Weekly Reports`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: project.owner_email,
        subject,
        body,
        from_name: 'Planify Reports',
      });
    }

    return Response.json({ success: true, projects_reported: projects.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});