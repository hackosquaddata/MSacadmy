import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

// Create a new support ticket (user)
export const createTicket = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { type, message } = req.body || {};
  const safeMessage = (message || '').toString().trim().slice(0, 5000);
    const allowed = ['payment', 'course_activation', 'exam', 'other'];
    const normalizedType = (type || '').toString().toLowerCase().replace(/\s+/g, '_');
    const ticketType = allowed.includes(normalizedType) ? normalizedType : 'other';

    if (!safeMessage || safeMessage.length < 5) {
      return res.status(400).json({ message: 'Please provide a brief message (min 5 chars)' });
    }

    // Fetch user profile for name/email
    let fullName = user.user_metadata?.full_name || null;
    let email = user.email || null;
    try {
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('full_name,email')
        .eq('id', user.id)
        .single();
      fullName = u?.full_name || fullName;
      email = u?.email || email;
    } catch {}

    const insert = {
      user_id: user.id,
      name: fullName || email || 'User',
      email: email,
      type: ticketType,
  message: safeMessage,
      status: 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([insert])
      .select()
      .single();

    if (error) {
      console.error('createTicket error:', error);
      return res.status(500).json({ message: 'Failed to create ticket' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('createTicket unexpected:', err);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
};

// List current user's tickets
export const listMyTickets = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, type, message, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('listMyTickets error:', error);
      return res.status(500).json({ message: 'Failed to fetch tickets' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('listMyTickets unexpected:', err);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// Admin: list all tickets with user & course context
export const listAllTickets = async (req, res) => {
  try {
    const admin = req.user;
    if (!admin) return res.status(401).json({ message: 'Unauthorized' });
    const { data: record } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', admin.id)
      .single();
    if (!record?.is_admin) return res.status(403).json({ message: 'Forbidden' });

    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, user_id, name, email, type, message, status, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('listAllTickets error:', error);
      return res.status(500).json({ message: 'Failed to fetch tickets' });
    }

    // Batch fetch user info
    const ids = Array.from(new Set((tickets || []).map(t => t.user_id).filter(Boolean)));
    let usersMap = {};
    if (ids.length) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', ids);
      usersMap = Object.fromEntries((users || []).map(u => [u.id, u]));
    }

    const mapped = (tickets || []).map(t => ({
      ...t,
      user: usersMap[t.user_id] || { full_name: t.name, email: t.email }
    }));
    res.json(mapped);
  } catch (err) {
    console.error('listAllTickets unexpected:', err);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// Admin: update status
export const updateTicketStatus = async (req, res) => {
  try {
    const admin = req.user;
    if (!admin) return res.status(401).json({ message: 'Unauthorized' });
    const { data: record } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', admin.id)
      .single();
    if (!record?.is_admin) return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['active', 'resolved', 'closed'];
    const normalized = (status || '').toString().toLowerCase();
    if (!allowed.includes(normalized)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status: normalized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('updateTicketStatus error:', error);
      return res.status(500).json({ message: 'Failed to update ticket' });
    }
    res.json({ message: 'Status updated', ticket: data });
  } catch (err) {
    console.error('updateTicketStatus unexpected:', err);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
};

// List comments for a ticket (admin or ticket owner)
export const listComments = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params; // ticket id

    // Check permission: admin or ticket owner
    const { data: record } = await supabaseAdmin.from('users').select('is_admin').eq('id', user.id).single();
    const isAdmin = !!record?.is_admin;

    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', id)
      .single();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!isAdmin && ticket.user_id !== user.id) return res.status(403).json({ message: 'Forbidden' });

    const { data, error } = await supabaseAdmin
      .from('support_ticket_comments')
      .select('id, author_id, author_is_admin, message, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('listComments error:', error);
      return res.status(500).json({ message: 'Failed to fetch comments' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('listComments unexpected:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// Add a comment to a ticket (admin or ticket owner)
export const addComment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params; // ticket id
  const { message } = req.body || {};
  const safeMessage = (message || '').toString().trim().slice(0, 5000);
  if (!safeMessage) return res.status(400).json({ message: 'Message required' });

    const { data: record } = await supabaseAdmin.from('users').select('is_admin').eq('id', user.id).single();
    const isAdmin = !!record?.is_admin;

    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', id)
      .single();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!isAdmin && ticket.user_id !== user.id) return res.status(403).json({ message: 'Forbidden' });

    const { data, error } = await supabaseAdmin
      .from('support_ticket_comments')
      .insert([{ ticket_id: ticket.id, author_id: user.id, author_is_admin: isAdmin, message: safeMessage }])
      .select()
      .single();
    if (error) {
      console.error('addComment error:', error);
      return res.status(500).json({ message: 'Failed to add comment' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('addComment unexpected:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};
