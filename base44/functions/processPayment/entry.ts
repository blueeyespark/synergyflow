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

    const { channel_id, amount, type, payment_method, description } = await req.json();

    if (!channel_id || !amount || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify channel ownership
    const channels = await base44.entities.Channel.list();
    const channel = channels.find(c => c.id === channel_id && c.creator_email === user.email);

    if (!channel) {
      return Response.json({ error: 'Channel not found or unauthorized' }, { status: 404 });
    }

    // In production: process with Stripe or PayPal API
    // For now: simulate payment processing

    const transaction_id = crypto.randomUUID();

    // Create budget entry
    const budgetEntry = await base44.entities.CreatorBudget.create({
      channel_id,
      title: description || `${type} Transaction`,
      type,
      amount,
      category: payment_method === 'stripe' ? 'subscriptions' : 'other',
      date: new Date().toISOString().split('T')[0],
      payment_method: payment_method || 'other',
      status: 'completed'
    });

    return Response.json({
      status: 'success',
      transaction_id,
      budget_entry_id: budgetEntry.id,
      amount,
      message: `Payment of $${amount} processed successfully`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});