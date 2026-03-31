import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schedule_id } = await req.json();

    if (!schedule_id) {
      return Response.json({ error: 'schedule_id is required' }, { status: 400 });
    }

    // Get schedule
    const schedules = await base44.entities.Schedule.list();
    const schedule = schedules.find(s => s.id === schedule_id);

    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Get authorized Google Calendar connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 401 });
    }

    // Prepare event
    const event = {
      summary: schedule.title,
      description: schedule.description || '',
      start: {
        dateTime: new Date(schedule.scheduled_date).toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(new Date(schedule.scheduled_date).getTime() + (schedule.expected_duration_minutes || 60) * 60000).toISOString(),
        timeZone: 'UTC'
      }
    };

    // Create event in Google Calendar
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Google Calendar API error: ${error}` }, { status: response.status });
    }

    const gcalEvent = await response.json();

    // Update schedule with Google Calendar event ID
    await base44.entities.Schedule.update(schedule_id, {
      synced_to_google_calendar: true,
      google_calendar_event_id: gcalEvent.id
    });

    return Response.json({
      status: 'synced',
      google_event_id: gcalEvent.id,
      google_event_link: gcalEvent.htmlLink
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});