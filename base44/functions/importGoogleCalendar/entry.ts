import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

  const body = await req.json().catch(() => ({}));
  const { project_id, days_ahead = 30 } = body;

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days_ahead * 24 * 60 * 60 * 1000).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=100&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!eventsRes.ok) {
    const err = await eventsRes.text();
    return Response.json({ error: 'Google Calendar API error', details: err }, { status: 500 });
  }

  const data = await eventsRes.json();
  const events = data.items || [];

  const created = [];
  for (const event of events) {
    if (!event.summary || event.status === 'cancelled') continue;
    const startDate = event.start?.date || event.start?.dateTime?.split('T')[0];
    const endDate = event.end?.date || event.end?.dateTime?.split('T')[0];

    const task = await base44.entities.Task.create({
      title: event.summary,
      description: (event.description || '') + (event.location ? `\n📍 ${event.location}` : '') + `\n\n[Imported from Google Calendar]`,
      due_date: endDate || startDate,
      start_date: startDate,
      status: 'todo',
      priority: 'medium',
      project_id: project_id || null,
      assigned_to: user.email,
    });
    created.push(task);
  }

  return Response.json({ imported: created.length, tasks: created });
});