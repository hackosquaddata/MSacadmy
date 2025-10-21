import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { apiUrl } from '../lib/api';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [posting, setPosting] = useState(false);
  const [reply, setReply] = useState('');

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const token = localStorage.getItem('token');

  const [form, setForm] = useState({ type: 'payment', message: '' });

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/support/mine'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load your tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  const loadComments = async (ticketId) => {
    try {
  const res = await fetch(apiUrl(`/api/support/${ticketId}/comments`), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setThread(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load thread');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.message || form.message.trim().length < 5) {
      toast.error('Please write a brief message');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/support'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Support request sent');
      setForm({ type: 'payment', message: '' });
      fetchMine();
    } catch (e) {
      console.error(e);
      toast.error('Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-300 mb-6">Support</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-black/30 border border-white/10 rounded-xl p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4">Create a ticket</h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Name</label>
                    <input value={user?.full_name || user?.email || 'User'} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input value={user?.email || ''} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Query type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300"
                  >
                    <option value="payment">Payment related</option>
                    <option value="course_activation">Course activation</option>
                    <option value="exam">Exam</option>
                    <option value="other">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={6}
                    placeholder="Describe your issue briefly..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </section>

            <section className="bg-black/30 border border-white/10 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your tickets</h2>
                <button onClick={fetchMine} className="text-xs text-slate-400 hover:text-slate-200">Refresh</button>
              </div>
              {loading ? (
                <div className="text-slate-400">Loading...</div>
              ) : tickets.length === 0 ? (
                <div className="text-slate-400">No tickets yet. Submit your first support request.</div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                  {tickets.map(t => {
                    const open = activeId === t.id;
                    return (
                      <div key={t.id} className="p-3 bg-black/30 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs uppercase tracking-wide text-slate-400">{t.type.replace(/_/g,' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${t.status === 'active' ? 'text-amber-300 border-amber-400/30 bg-amber-500/10' : t.status === 'resolved' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' : 'text-slate-300 border-white/20 bg-white/5'}`}>{t.status}</span>
                            <button onClick={async () => { const willOpen = activeId !== t.id; setActiveId(willOpen ? t.id : null); if (willOpen) { await loadComments(t.id); } }} className="text-xs text-slate-400 hover:text-slate-200">{open ? 'Hide' : 'View'}</button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-200 whitespace-pre-wrap">{t.message}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{new Date(t.created_at).toLocaleString()}</div>

                        {open && (
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <div className="text-xs text-slate-400 mb-2">Thread</div>
                            <ul className="space-y-2">
                              {thread.map(c => (
                                <li key={c.id} className={`px-3 py-2 rounded-lg border ${c.author_is_admin ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100' : 'bg-white/5 border-white/10 text-slate-200'}`}>
                                  <div className="text-[11px] opacity-70 mb-1">{c.author_is_admin ? 'Admin' : 'You'} • {new Date(c.created_at).toLocaleString()}</div>
                                  <div className="text-sm whitespace-pre-wrap">{c.message}</div>
                                </li>
                              ))}
                              {thread.length === 0 && <li className="text-slate-500 text-sm">No replies yet.</li>}
                            </ul>
                            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
                              e.preventDefault();
                              if (!reply.trim()) return;
                              setPosting(true);
                              try {
                                const res = await fetch(apiUrl(`/api/support/${t.id}/comments`), {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ message: reply })
                                });
                                if (!res.ok) throw new Error('Failed');
                                setReply('');
                                await loadComments(t.id);
                              } catch (e) {
                                console.error(e);
                                toast.error('Could not post reply');
                              } finally {
                                setPosting(false);
                              }
                            }}>
                              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply..." className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200" />
                              <button disabled={posting} className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 disabled:opacity-50">{posting ? 'Posting...' : 'Reply'}</button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
