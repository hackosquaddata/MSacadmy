import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { apiUrl } from '../lib/api';

export default function PaymentModal({ open, onClose, amount, upiQr, upiAddress, courseId, courseTitle, providerName, sessionExpiresAt, onSuccess }) {
  const [transactionId, setTransactionId] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCopy = (text, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => toast.success(label));
  };

  const handleSubmit = async () => {
    if (!transactionId && !receiptEmail) {
      toast.error('Please provide a transaction ID or receipt email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payments/submit/${courseId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transaction_id: transactionId || undefined, receipt_email: receiptEmail || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Payment submit failed:', res.status, data);
        toast.error(data.message || 'Failed to submit payment');
        setLoading(false);
        return;
      }

      toast.success(data.message || 'Payment submitted');
      setTransactionId('');
      setReceiptEmail('');
      onSuccess && onSuccess(data.payment || data);
  // Notify other parts of the app (overlay) to refresh
  try { window.dispatchEvent(new CustomEvent('paymentSubmitted', { detail: { payment: data.payment || data } })); } catch (e) {}
      onClose();
    } catch (err) {
      console.error('Submit manual payment error:', err);
      toast.error('Network error while submitting payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Company logo" className="h-10 w-10 object-contain" onError={(e)=>{e.target.style.display='none'}} />
            <div>
              <div className="text-sm text-gray-500">You're paying for</div>
              <div className="text-lg font-semibold">{courseTitle || 'Course'}</div>
              <div className="text-xs text-gray-400">{providerName || 'MS Academy'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Amount</div>
            <div className="text-xl font-bold">₹{amount}</div>
          </div>
        </header>

        <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded p-4 mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {upiQr ? (
                    <img src={upiQr} alt="UPI QR" className="h-40 w-40 object-contain rounded border" />
                  ) : (
                    <div className="h-40 w-40 bg-white border rounded flex items-center justify-center">No QR</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-2">Scan QR or pay with UPI</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-mono font-semibold">{upiAddress || 'upi@bank'}</div>
                    <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => handleCopy(upiAddress, 'UPI ID copied')}>Copy</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">After making payment, paste the transaction ID or the receipt email below. We verify payments manually and usually grant access within a few hours.</p>
                  {sessionExpiresAt && <p className="text-xs text-gray-400 mt-2">Session expires: {new Date(sessionExpiresAt).toLocaleString()}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium">Transaction ID</label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g., TXN123456" className="w-full border rounded px-3 py-2" />

              <label className="block text-sm font-medium">Receipt Email</label>
              <input value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)} placeholder="Email used for receipt (optional)" className="w-full border rounded px-3 py-2" />

              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">Need help? Contact <a href="mailto:support@msacademy.example" className="text-blue-600">support@msacademy.example</a></div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose} disabled={loading}>Cancel</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit for verification'}</button>
                </div>
              </div>
            </div>
          </div>

          <aside className="md:col-span-1 bg-white border rounded p-4">
            <div className="text-sm text-gray-500 mb-2">Order summary</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">{courseTitle || 'Course'}</div>
              <div className="font-semibold">₹{amount}</div>
            </div>
            <div className="text-xs text-gray-500">Payment method: Manual UPI</div>
            <div className="mt-4">
              <div className="text-xs text-gray-400">Security</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Trusted</div>
                <div className="text-xs text-gray-500">Verified seller</div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
