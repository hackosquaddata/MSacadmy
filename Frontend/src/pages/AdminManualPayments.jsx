import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../lib/api';

export default function AdminManualPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(apiUrl('/api/payments/manual-payments'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load manual payments');
      }
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch payments error:', e);
      setError(e?.message || 'Failed to load manual payments');
      toast.error(e?.message || 'Failed to load manual payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const approve = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/payments/manual-payments/${id}/approve`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to approve');
        return;
      }
      toast.success(data.message || 'Approved');
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Network error');
    }
  };

  const reject = async (id) => {
    if (!confirm('Reject this payment?')) return;
    try {
      const res = await fetch(apiUrl(`/api/payments/manual-payments/${id}/reject`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to reject');
        return;
      }
      setPayments(prev => prev.filter(p => p.id !== id));
      toast.success('Rejected');
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Network error');
    }
  };

  const filteredPayments = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter(p => {
      const title = p.course?.title || '';
      const name = p.user?.full_name || '';
      const email = p.user?.email || '';
      const txn = p.transaction_id || '';
      const receipt = p.receipt_email || '';
      return [title, name, email, txn, receipt].some(v => String(v).toLowerCase().includes(query));
    });
  }, [payments, q]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const p of filteredPayments) {
      const s = (p.status || '').toLowerCase();
      if (s === 'approved') c.approved++;
      else if (s === 'rejected') c.rejected++;
      else c.pending++;
    }
    return c;
  }, [filteredPayments]);

  return (
    <AdminLayout title="Manual Payments">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, email, course, or transaction"
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">Pending: {counts.pending}</span>
          <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">Approved: {counts.approved}</span>
          <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/15 text-red-200 border border-red-400/30">Rejected: {counts.rejected}</span>
          <button onClick={fetchPayments} className="ml-1 px-3 py-2 text-xs rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs counts={counts} />

      {/* Big cards grid for active tab */}
      <PaymentsGrid
        loading={loading}
        items={filteredPayments}
        counts={counts}
        onApprove={approve}
        onReject={reject}
      />
    </AdminLayout>
  );
}

// Inline components for clarity
function Tabs({ counts }) {
  const [active, setActive] = useState('pending');
  // Expose active tab via a custom event so PaymentsGrid can read it
  useEffect(() => {
    const evt = new CustomEvent('manual-payments-active-tab', { detail: active });
    window.dispatchEvent(evt);
  }, [active]);

  const tabBtn = (key, label, color) => (
    <button
      onClick={() => setActive(key)}
      className={`px-4 py-2 rounded-full border text-sm transition ${
        active === key
          ? `${color.bg} ${color.text} ${color.border}`
          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
      }`}
    >
      {label} <span className="ml-2 text-xs opacity-80">{counts[key]}</span>
    </button>
  );

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {tabBtn('pending', 'Pending', { bg: 'bg-amber-500/20', text: 'text-amber-200', border: 'border-amber-400/30' })}
      {tabBtn('approved', 'Approved', { bg: 'bg-emerald-500/20', text: 'text-emerald-200', border: 'border-emerald-400/30' })}
      {tabBtn('rejected', 'Rejected', { bg: 'bg-red-500/20', text: 'text-red-200', border: 'border-red-400/30' })}
    </div>
  );
}

function PaymentsGrid({ loading, items, counts, onApprove, onReject }) {
  const [active, setActive] = useState('pending');
  useEffect(() => {
    const handler = (e) => setActive(e.detail || 'pending');
    window.addEventListener('manual-payments-active-tab', handler);
    return () => window.removeEventListener('manual-payments-active-tab', handler);
  }, []);

  const list = useMemo(
    () => items.filter(p => (p.status || '').toLowerCase() === active),
    [items, active]
  );

  return (
    <div>
      {loading && list.length === 0 ? (
        <div className="py-8 text-slate-400">Loading…</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-slate-400">No {active} payments</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6">
          {list.map(p => (
            <div key={p.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg min-h-[160px]">
              <div className="flex items-start gap-4">
                <img src={p.course?.thumbnail || '/placeholder-course.png'} alt="course" className="w-32 h-24 object-cover rounded-xl border border-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base md:text-lg font-semibold text-slate-100 truncate" title={p.course?.title || p.course_id}>{p.course?.title || p.course_id}</h4>
                    <span className={`px-2 py-0.5 text-[11px] rounded-full border ${
                      active === 'approved' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' :
                      active === 'rejected' ? 'bg-red-500/15 text-red-200 border-red-400/30' :
                      'bg-amber-500/15 text-amber-200 border-amber-400/30'
                    }`}>{active}</span>
                  </div>
                  <div className="mt-1 text-sm md:text-base text-slate-300">
                    <span className="text-slate-300">Name:</span> {p.user?.full_name || '—'}
                    {p.user?.email ? <span className="ml-2 text-slate-500 break-all">({p.user.email})</span> : null}
                  </div>
                  <div className="mt-1 text-sm md:text-base text-slate-300">Amount: <span className="text-slate-100">₹{p.amount ?? '-'}</span></div>
                  {p.coupon_code && (
                    <div className="mt-1 text-xs text-emerald-200">
                      Coupon: <span className="px-1.5 py-0.5 rounded border border-emerald-400/30 bg-emerald-500/10">{p.coupon_code}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 text-xs md:text-sm text-slate-500 flex items-start gap-3">
                <span
                  className="font-mono tracking-wide break-all bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 px-2 py-0.5 rounded"
                  title={p.transaction_id || p.receipt_email}
                >
                  {p.transaction_id || p.receipt_email || '—'}
                </span>
                {(p.transaction_id || p.receipt_email) && (
                  <button
                    className="px-3 py-1 rounded bg-white/10 border border-white/10 hover:bg-white/20 text-xs"
                    onClick={() => {
                      const val = p.transaction_id || p.receipt_email;
                      if (!val) return;
                      navigator.clipboard?.writeText(val).then(() => toast.success('Copied')).catch(() => toast.error('Copy failed'));
                    }}
                  >Copy</button>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                {active === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onApprove(p.id)} className="px-4 py-2 text-sm rounded bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25">Approve</button>
                    <button onClick={() => onReject(p.id)} className="px-4 py-2 text-sm rounded bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25">Reject</button>
                  </div>
                ) : (
                  <div className="text-xs md:text-sm text-slate-500">{p.processed_at ? new Date(p.processed_at).toLocaleString() : ''}</div>
                )}
                <div className="text-[11px] text-slate-500">{new Date(p.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
