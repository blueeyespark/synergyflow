import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (no auth) and manual (admin) calls
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {
      // Scheduled calls won't have a user — allow them
      isScheduled = true;
    }

    const [tasks, projects, timeEntries] = await Promise.all([
      base44.asServiceRole.entities.Task.list(),
      base44.asServiceRole.entities.Project.list(),
      base44.asServiceRole.entities.TimeEntry.list(),
    ]);

    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);

    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    );
    const completedThisWeek = tasks.filter(t =>
      t.completed_at && new Date(t.completed_at) > weekAgo
    );
    const activeProjects = projects.filter(p => p.status !== 'completed');
    const billableHours = timeEntries
      .filter(e => e.is_billable && e.start_time && new Date(e.start_time) > weekAgo)
      .reduce((s, e) => s + (e.duration_seconds || 0) / 3600, 0);

    // Project health breakdown
    const projectHealth = activeProjects.map(p => {
      const pTasks = tasks.filter(t => t.project_id === p.id);
      const pOverdue = pTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
      const pDone = pTasks.filter(t => t.status === 'completed');
      const pct = pTasks.length > 0 ? Math.round((pDone.length / pTasks.length) * 100) : 0;
      return { name: p.name, total: pTasks.length, done: pDone.length, overdue: pOverdue.length, pct, status: p.status };
    });

    // AI summary
    const aiPrompt = `You are writing a weekly project health email for a management team. Be concise (3-4 sentences max).

Data:
- Active projects: ${activeProjects.length}
- Tasks completed this week: ${completedThisWeek.length}
- Overdue tasks: ${overdue.length}
- Billable hours logged: ${billableHours.toFixed(1)}h

Project breakdown:
${projectHealth.map(p => `• ${p.name}: ${p.pct}% complete, ${p.overdue} overdue`).join('\n')}

Write a professional, actionable summary starting with "This week," highlighting wins and concerns.`;

    const aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: aiPrompt });

    // Build burn-down text table
    const burndownRows = projectHealth.map(p =>
      `  ${p.name.padEnd(25)} ${String(p.pct + '%').padEnd(8)} ${p.done}/${p.total} tasks  ${p.overdue > 0 ? `⚠ ${p.overdue} overdue` : '✓'}`
    ).join('\n');

    const overdueList = overdue.slice(0, 10).map(t => {
      const proj = projects.find(p => p.id === t.project_id);
      return `  • [${proj?.name || 'N/A'}] ${t.title} — due ${t.due_date}${t.assigned_to ? ` (${t.assigned_to.split('@')[0]})` : ''}`;
    }).join('\n');

    const emailBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PLANIFY — WEEKLY PROJECT HEALTH REPORT
  Week ending ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 AI SUMMARY
${aiSummary}

━━━━━━━━━━━━━━━━━━

📈 KEY METRICS
  Active Projects:        ${activeProjects.length}
  Tasks Completed (7d):   ${completedThisWeek.length}
  Overdue Tasks:          ${overdue.length}
  Billable Hours (7d):    ${billableHours.toFixed(1)}h

━━━━━━━━━━━━━━━━━━

📋 PROJECT BURN-DOWN
  ${'Project'.padEnd(25)} Progress  Tasks        Status
  ${'─'.repeat(60)}
${burndownRows}

━━━━━━━━━━━━━━━━━━

${overdue.length > 0 ? `⚠️  OVERDUE TASKS (${overdue.length} total, showing top 10)
${overdueList}
` : '✅  No overdue tasks this week!\n'}
━━━━━━━━━━━━━━━━━━

This report was generated automatically by Planify.
    `.trim();

    // Get all admin users to email
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');

    const emailPromises = admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `📊 Weekly Project Health Report — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        body: emailBody,
      })
    );
    await Promise.all(emailPromises);

    return Response.json({
      success: true,
      sent_to: admins.map(u => u.email),
      summary: { activeProjects: activeProjects.length, completedThisWeek: completedThisWeek.length, overdue: overdue.length, billableHours: billableHours.toFixed(1) }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});