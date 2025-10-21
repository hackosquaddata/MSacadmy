import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function QuizView({ contentId, onResult }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/api/auth/v1/content/${contentId}/quiz`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load quiz');
        const data = await res.json();
        setQuiz(data);
      } catch (e) {
        console.error(e);
        toast.error('Unable to load quiz');
      } finally {
        setLoading(false);
      }
    };
    if (contentId) run();
  }, [contentId]);

  const toggleMulti = (qid, option) => {
    setAnswers(prev => {
      const arr = Array.isArray(prev[qid]) ? [...prev[qid]] : [];
      const idx = arr.indexOf(option);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(option);
      return { ...prev, [qid]: arr };
    });
  };

  const submit = async () => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/auth/v1/content/${contentId}/quiz`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) throw new Error('Failed to submit quiz');
      const data = await res.json();
      setResult(data);
      toast.success(`Score: ${data.score}%`);
      onResult && onResult(data);
    } catch (e) {
      console.error(e);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-300">Loading quiz…</div>;
  }
  if (!quiz) {
    return <div className="text-slate-400">No quiz found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">{quiz.title || 'Quiz'}</h2>
        {result && (
          <div className={`mt-3 px-3 py-2 rounded-lg border ${result.completed ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' : 'bg-white/5 border-white/10 text-slate-300'}`}>
            Score: {result.score}% ({result.correct}/{result.total})
          </div>
        )}
      </div>

      <div className="space-y-5">
        {quiz.questions?.map((q, idx) => (
          <div key={q.id} className="p-4 rounded-lg border border-white/10 bg-black/30">
            <div className="text-slate-100 font-medium mb-3">{idx + 1}. {q.text}</div>
            <div className="space-y-2">
              {q.options?.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-slate-300">
                  {q.type === 'multi' ? (
                    <input
                      type="checkbox"
                      checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)}
                      onChange={() => toggleMulti(q.id, opt)}
                    />
                  ) : (
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    />
                  )}
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="px-4 py-2 bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 rounded-lg disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Quiz'}
      </button>
    </div>
  );
}
