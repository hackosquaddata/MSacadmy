import React, { useState, useEffect } from 'react';

// QuizBuilder allows admins to build a quiz visually and outputs a JSON object via onChange
export default function QuizBuilder({ value, onChange }) {
  const [title, setTitle] = useState(value?.title || 'Quiz');
  const [passMark, setPassMark] = useState(value?.meta?.passMark ?? 70);
  const [questions, setQuestions] = useState(() => {
    const qs = Array.isArray(value?.questions) ? value.questions : [];
    return qs.map(q => ({
      id: q.id || crypto.randomUUID(),
      text: q.text || '',
      type: q.type || 'single',
      options: Array.isArray(q.options) ? q.options : [''],
      answer: q.answer ?? (q.type === 'multi' ? [] : '')
    }));
  });

  useEffect(() => {
    const json = {
      title,
      meta: { passMark: Number(passMark) || 0 },
      questions: questions.map(q => ({ id: q.id, text: q.text, type: q.type, options: q.options, answer: q.answer }))
    };
    onChange && onChange(json);
  }, [title, passMark, questions]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: crypto.randomUUID(), text: '', type: 'single', options: [''], answer: '' }]);
  };

  const removeQuestion = (qid) => {
    setQuestions(prev => prev.filter(q => q.id !== qid));
  };

  const updateQuestion = (qid, updates) => {
    setQuestions(prev => prev.map(q => q.id === qid ? { ...q, ...updates } : q));
  };

  const addOption = (qid) => {
    setQuestions(prev => prev.map(q => q.id === qid ? { ...q, options: [...q.options, ''] } : q));
  };

  const updateOption = (qid, idx, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  };

  const removeOption = (qid, idx) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const opts = q.options.filter((_, i) => i !== idx);
      // Clean answer if necessary
      let answer = q.answer;
      if (q.type === 'single' && typeof answer === 'string' && answer === q.options[idx]) {
        answer = '';
      } else if (q.type === 'multi' && Array.isArray(answer)) {
        answer = answer.filter(a => a !== q.options[idx]);
      }
      return { ...q, options: opts, answer };
    }));
  };

  const setAnswer = (qid, opt) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      if (q.type === 'single') {
        return { ...q, answer: opt };
      }
      const arr = Array.isArray(q.answer) ? [...q.answer] : [];
      const i = arr.indexOf(opt);
      if (i >= 0) arr.splice(i, 1); else arr.push(opt);
      return { ...q, answer: arr };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-1">Quiz Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100"
            placeholder="Quiz title"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Pass Mark (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passMark}
            onChange={(e) => setPassMark(e.target.value)}
            className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-4 rounded-lg border border-white/10 bg-black/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400 text-sm">Question {idx + 1}</div>
              <button type="button" className="text-slate-400 hover:text-red-300" onClick={() => removeQuestion(q.id)}>Remove</button>
            </div>
            <input
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100 mb-3"
              placeholder="Enter question text"
            />
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-slate-400">Type</label>
              <select
                value={q.type}
                onChange={(e) => updateQuestion(q.id, { type: e.target.value, answer: e.target.value === 'multi' ? [] : '' })}
                className="p-2 bg-black/30 border border-white/10 rounded text-slate-100"
              >
                <option value="single">Single answer</option>
                <option value="multi">Multiple answers</option>
              </select>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  {q.type === 'single' ? (
                    <input type="radio" name={`ans-${q.id}`} checked={q.answer === opt} onChange={() => setAnswer(q.id, opt)} />
                  ) : (
                    <input type="checkbox" checked={Array.isArray(q.answer) && q.answer.includes(opt)} onChange={() => setAnswer(q.id, opt)} />
                  )}
                  <input
                    value={opt}
                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                    className="flex-1 p-2 bg-black/30 border border-white/10 rounded text-slate-100"
                    placeholder={`Option ${i + 1}`}
                  />
                  <button type="button" className="text-slate-400 hover:text-red-300" onClick={() => removeOption(q.id, i)}>Remove</button>
                </div>
              ))}
              <button type="button" className="text-emerald-300 hover:text-emerald-200" onClick={() => addOption(q.id)}>Add option</button>
            </div>
          </div>
        ))}
        <button type="button" className="text-emerald-300 hover:text-emerald-200" onClick={addQuestion}>Add question</button>
      </div>
    </div>
  );
}
