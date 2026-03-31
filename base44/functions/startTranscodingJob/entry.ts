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

    const { video_id, upload_key } = await req.json();

    if (!video_id || !upload_key) {
      return Response.json({ error: 'Missing video_id or upload_key' }, { status: 400 });
    }

    // Get video
    const video = await base44.entities.Video.list();
    const targetVideo = video.find(v => v.id === video_id);

    if (!targetVideo) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Update video status to processing
    await base44.entities.Video.update(video_id, {
      status: 'processing',
      transcoding_progress: 0
    });

    // In production: enqueue job to transcoding worker (RabbitMQ, SQS, etc.)
    // Queue job with:
    // - input: upload_key (S3 object)
    // - outputs: 1080p, 720p, 480p, 360p, 240p HLS manifests
    // - callback: webhook to update video status when done

    // Simulate job enqueue
    const jobId = crypto.randomUUID();

    return Response.json({
      status: 'queued',
      job_id: jobId,
      video_id: video_id,
      message: 'Transcoding job started. Check video status for progress.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});