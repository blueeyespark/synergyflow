import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { video_id, views, watch_time_hours, likes, comments, shares, retention_rate, revenue } = await req.json();

    if (!video_id) {
      return Response.json({ error: 'video_id is required' }, { status: 400 });
    }

    // Get video to get channel_id
    const videos = await base44.entities.Video.list();
    const video = videos.find(v => v.id === video_id);

    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Create or update analytics entry for today
    const today = new Date().toISOString().split('T')[0];

    // Try to find existing analytics for today
    const analytics = await base44.entities.VideoAnalytics.filter({
      video_id,
      date: today
    });

    if (analytics.length > 0) {
      // Update existing
      await base44.entities.VideoAnalytics.update(analytics[0].id, {
        views: (analytics[0].views || 0) + (views || 0),
        watch_time_hours: (analytics[0].watch_time_hours || 0) + (watch_time_hours || 0),
        likes: (analytics[0].likes || 0) + (likes || 0),
        comments: (analytics[0].comments || 0) + (comments || 0),
        shares: (analytics[0].shares || 0) + (shares || 0),
        retention_rate: retention_rate || analytics[0].retention_rate,
        revenue: (analytics[0].revenue || 0) + (revenue || 0)
      });
    } else {
      // Create new
      await base44.entities.VideoAnalytics.create({
        video_id,
        channel_id: video.channel_id,
        date: today,
        views: views || 0,
        watch_time_hours: watch_time_hours || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        retention_rate: retention_rate || 0,
        revenue: revenue || 0
      });
    }

    // Update video counters
    await base44.entities.Video.update(video_id, {
      view_count: (video.view_count || 0) + (views || 0),
      like_count: (video.like_count || 0) + (likes || 0),
      comment_count: (video.comment_count || 0) + (comments || 0)
    });

    return Response.json({
      status: 'recorded',
      message: 'Analytics recorded successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});