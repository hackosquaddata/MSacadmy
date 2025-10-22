import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function PendingPaymentsOverlay() {
  const [payments, setPayments] = useState([]);
  const [polling, setPolling] = useState(false);

  const fetchPayments = async () => {
    try {
      // Fetch pending manual payments for the current user from Supabase directly
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      if (!userId) return setPayments([]);
      const { data, error } = await supabase
        .from('manual_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to fetch user manual payments:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    setPolling(true);
    const id = setInterval(fetchPayments, 30000); // poll every 30s

    const handler = () => fetchPayments();
    window.addEventListener('paymentSubmitted', handler);

    return () => { clearInterval(id); setPolling(false); window.removeEventListener('paymentSubmitted', handler); };
  }, []);

  if (!payments?.length) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Payments in verification</div>
          <div className="text-xs text-gray-400">{polling ? 'Live' : 'Idle'}</div>
        </div>
        <div className="max-h-64 overflow-auto">
          {payments.map(p => (
            <div key={p.id} className="p-3 flex items-center gap-3 border-b last:border-b-0">
              <img src={p.course_thumbnail || '/placeholder-course.png'} alt="thumb" className="h-12 w-12 object-cover rounded" />
              <div className="flex-1">
                <div className="text-sm font-medium">{p.course_title || p.course_id}</div>
                <div className="text-xs text-gray-500">Status: {p.status}</div>
              </div>
              <div className="text-xs">
                {p.status === 'pending' ? <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Verifying</div> : <div className="px-2 py-1 bg-green-100 text-green-800 rounded">{p.status}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 text-center text-xs text-gray-500">Payments verified will disappear automatically</div>
      </div>
    </div>
  );
}
