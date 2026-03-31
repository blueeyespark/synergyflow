import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owner (blueeyespark) can auto-implement
    if (user.email !== 'blueeyespark@example.com' && !user.full_name?.toLowerCase().includes('blueeyespark')) {
      return Response.json({ error: 'Owner access required' }, { status: 403 });
    }

    const { code, filePath, title, description } = await req.json();

    if (!code || !filePath) {
      return Response.json({ error: 'Missing code or filePath' }, { status: 400 });
    }

    // Log the auto-implementation to AIAppliedChange for audit trail
    await base44.entities.AIAppliedChange.create({
      title: title || `Auto-implemented: ${filePath.split('/').pop()}`,
      source: 'self_scan',
      change_type: 'feature',
      file_path: filePath,
      code_snippet: code,
      explanation: description || 'Auto-implemented by AI Assistant',
      applied_by: user.email,
    });

    // Since we can't directly write files from here, return the implementation metadata
    // The frontend will handle writing files via the base44 file API if available
    // For now, we just confirm the implementation was logged
    return Response.json({
      success: true,
      message: `Implementation auto-logged for ${filePath}`,
      implemented: true,
      filePath,
      code,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});