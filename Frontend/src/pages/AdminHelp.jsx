import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { apiUrl } from '../lib/api';

export default function AdminHelp() {
  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [threads, setThreads] = useState({}); // ticketId -> comments
  const [reply, setReply] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
  const res = await fetch(apiUrl('/api/support/admin/all'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const loadComments = async (ticketId) => {
    try {
  const res = await fetch(apiUrl(`/api/support/${ticketId}/comments`), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setThreads(prev => ({ ...prev, [ticketId]: Array.isArray(data) ? data : [] }));
    } catch (e) { console.error(e); toast.error('Failed to load thread'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(apiUrl(`/api/support/admin/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Status updated');
      fetchAll();
    } catch (e) {
      console.error(e);
      toast.error('Could not update status');
    }
  };

  const tabs = ['active', 'resolved', 'closed'];
  const [tab, setTab] = useState('active');

  const filtered = tickets.filter(t => t.status === tab);

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-300">Help Desk</h1>
            <button onClick={fetchAll} className="text-xs text-slate-400 hover:text-slate-200">Refresh</button>
          </div>

          <div className="flex gap-2 mb-4">
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded border text-xs ${tab === t ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' : 'bg-white/5 border-white/15 text-slate-300'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-slate-400">No tickets in this state.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(t => (
                <div key={t.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{t.type?.replace(/_/g,' ')}</div>
                    <div className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap mb-3">{t.message}</div>
                  <div className="mt-auto pt-3 border-t border-white/10">
                    <div className="text-[11px] text-slate-400 mb-2">From: <span className="text-slate-200">{t.user?.full_name || t.name || 'User'}</span> • <span className="text-slate-300">{t.user?.email || t.email || '—'}</span></div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => updateStatus(t.id, 'active')} className={`px-2 py-1 rounded border text-xs ${t.status==='active'?'bg-amber-500/10 border-amber-400/30 text-amber-200':'bg-white/5 border-white/15 text-slate-300'}`}>Active</button>
                      <button onClick={() => updateStatus(t.id, 'resolved')} className={`px-2 py-1 rounded border text-xs ${t.status==='resolved'?'bg-emerald-500/10 border-emerald-400/30 text-emerald-200':'bg-white/5 border-white/15 text-slate-300'}`}>Resolved</button>
                      <button onClick={() => updateStatus(t.id, 'closed')} className={`px-2 py-1 rounded border text-xs ${t.status==='closed'?'bg-slate-600/20 border-slate-400/30 text-slate-200':'bg-white/5 border-white/15 text-slate-300'}`}>Closed</button>
                    </div>
                    <div>
                      <button onClick={async () => { const willOpen = activeId !== t.id; setActiveId(willOpen ? t.id : null); if (willOpen) await loadComments(t.id); }} className="text-xs text-slate-400 hover:text-slate-200">{activeId===t.id?'Hide thread':'View thread'}</button>
                    </div>
                    {activeId === t.id && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-2">Thread</div>
                        <ul className="space-y-2">
                          {(threads[t.id] || []).map(c => (
                            <li key={c.id} className={`px-3 py-2 rounded-lg border ${c.author_is_admin ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100' : 'bg-white/5 border-white/10 text-slate-200'}`}>
                              <div className="text-[11px] opacity-70 mb-1">{c.author_is_admin ? 'Admin' : 'User'} • {new Date(c.created_at).toLocaleString()}</div>
                              <div className="text-sm whitespace-pre-wrap">{c.message}</div>
                            </li>
                          ))}
                          {(threads[t.id] || []).length === 0 && <li className="text-slate-500 text-sm">No replies yet.</li>}
                        </ul>
                        <form className="mt-3 flex gap-2" onSubmit={async (e) => {
                          e.preventDefault();
                          if (!reply.trim()) return;
                          setPosting(true);
                          try {
                            const res = await fetch(apiUrl(`/api/support/${t.id}/comments`), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ message: reply })
                            });
                            if (!res.ok) throw new Error('Failed');
                            setReply('');
                            await loadComments(t.id);
                          } catch (e) { console.error(e); toast.error('Could not post reply'); }
                          finally { setPosting(false); }
                        }}>
                          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply..." className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200" />
                          <button disabled={posting} className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 disabled:opacity-50">{posting ? 'Posting...' : 'Reply'}</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
