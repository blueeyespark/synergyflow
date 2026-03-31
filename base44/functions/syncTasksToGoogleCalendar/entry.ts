import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Fetch tasks with due dates
    const tasks = await base44.entities.Task.list('-created_date');
    const tasksWithDates = tasks.filter(t => t.due_date && t.created_by === user.email);

    let synced = 0;
    let failed = 0;

    for (const task of tasksWithDates) {
      try {
        const eventBody = {
          summary: task.title,
          description: task.description || '',
          start: { date: task.due_date },
          end: { date: task.due_date },
          extendedProperties: {
            private: {
              taskId: task.id,
              priority: task.priority || 'medium',
              status: task.status || 'todo'
            }
          }
        };

        // Check if event already exists by querying with taskId
        const queryRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?q=' + encodeURIComponent(task.id),
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const existing = await queryRes.json();
        const existingEvent = existing.items?.find(e => e.extendedProperties?.private?.taskId === task.id);

        if (existingEvent) {
          // Update existing event
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`,
            {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventBody)
            }
          );
        } else {
          // Create new event
          await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(eventBody)
            }
          );
        }
        synced++;
      } catch (err) {
        console.error(`Failed to sync task ${task.id}:`, err.message);
        failed++;
      }
    }

    // Update sync preference
    await base44.auth.updateMe({ calendar_sync_enabled: true, last_calendar_sync: new Date().toISOString() });

    return Response.json({ synced, failed, message: `Synced ${synced} tasks to Google Calendar` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});