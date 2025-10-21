import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../lib/api';

export default function AdminCouponUsage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialCode = (params.get('code') || '').toUpperCase();

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const token = localStorage.getItem('token');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const url = `${API_BASE}/api/payments/coupons/usages` + (code ? `?code=${encodeURIComponent(code)}` : '');
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data && data.message) || 'Failed to load coupon usages');
      // Support multiple response shapes: bare array, { usages: [...] }, or { rows: [...] }
      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data?.usages)) {
        setItems(data.usages);
      } else if (Array.isArray(data?.rows)) {
        setItems(data.rows);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('Coupon usages load error:', e);
      setError(e?.message || 'Failed to load coupon usages');
      toast.error(e?.message || 'Failed to load coupon usages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Counts by status for quick glance
  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const it of items) {
      const s = (it.status || '').toLowerCase();
      if (s === 'approved') c.approved++;
      else if (s === 'rejected') c.rejected++;
      else c.pending++;
    }
    return c;
  }, [items]);

  const onApplyFilter = () => {
    const next = new URLSearchParams(search);
    if (code) next.set('code', code.toUpperCase()); else next.delete('code');
    navigate({ search: `?${next.toString()}` }, { replace: true });
    load();
  };

  return (
    <AdminLayout title="Coupon Usage">
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Filter by coupon code (e.g., MS10)"
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
          <button onClick={onApplyFilter} className="px-3 py-2 text-sm rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10">Apply</button>
          <button onClick={() => { setCode(''); navigate({ search: '' }, { replace: true }); load(); }} className="px-3 py-2 text-sm rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10">Clear</button>
          <button onClick={load} className="px-3 py-2 text-sm rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10">Refresh</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">Pending: {counts.pending}</span>
          <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">Approved: {counts.approved}</span>
          <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/15 text-red-200 border border-red-400/30">Rejected: {counts.rejected}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">Usages {code ? `• ${code}` : ''}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && items.length === 0 ? (
                <tr><td className="px-6 py-4 text-slate-400" colSpan={6}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-6 py-6 text-slate-400" colSpan={6}>No usages found</td></tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="text-slate-200">
                    <td className="px-6 py-3 whitespace-nowrap">{u.user_name || u.user_email || u.user_id}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-400">{u.user_email || '—'}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{u.course_title || u.course_id}</td>
                    <td className="px-6 py-3 whitespace-nowrap"><span className="px-2 py-0.5 text-[11px] rounded border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">{u.coupon_code || '—'}</span></td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[11px] rounded-full border ${
                        (u.status || '').toLowerCase() === 'approved' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' :
                        (u.status || '').toLowerCase() === 'rejected' ? 'bg-red-500/15 text-red-200 border-red-400/30' :
                        'bg-amber-500/15 text-amber-200 border-amber-400/30'
                      }`}>{u.status}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-400">{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
