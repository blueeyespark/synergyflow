import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateUUID() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return [...array].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { channel_name, description, categories } = body;

    if (!channel_name) {
      return Response.json({ error: 'Channel name is required' }, { status: 400 });
    }

    // Check if channel name already exists
    const existing = await base44.asServiceRole.entities.Channel.filter({ channel_name });
    if (existing.length > 0) {
      return Response.json({ error: 'Channel name already taken' }, { status: 409 });
    }

    // Generate RTMP key
    const rtmpKey = generateUUID();

    // Create channel using service role
    const channel = await base44.asServiceRole.entities.Channel.create({
      creator_email: user.email,
      channel_name,
      description: description || '',
      rtmp_key: rtmpKey,
      categories: categories || []
    });

    return Response.json({
      data: { channel },
      message: 'Channel created successfully'
    });
  } catch (error) {
    console.error('Channel creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});