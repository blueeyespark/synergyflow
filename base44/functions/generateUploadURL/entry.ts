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

    const { filename, size, content_type } = await req.json();

    if (!filename || !size) {
      return Response.json({ error: 'Missing filename or size' }, { status: 400 });
    }

    // Generate S3 presigned URL for direct upload
    // In production: use AWS SDK to generate presigned URL
    const uploadId = crypto.randomUUID();
    const uploadKey = `videos/${user.email}/${uploadId}/${filename}`;

    // Simulate presigned URL (in production, call AWS SDK)
    const presignedUrl = `https://s3.amazonaws.com/creator-platform/${uploadKey}?signature=mock`;

    // Create video record in pending state
    const video = await base44.entities.Video.create({
      channel_id: '', // Will be set by frontend
      title: filename.split('.')[0],
      status: 'uploading',
      raw_upload_url: uploadKey
    });

    return Response.json({
      upload_url: presignedUrl,
      video_id: video.id,
      upload_key: uploadKey
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});