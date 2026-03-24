'use client';

import { useEffect, useState } from 'react';

export default function FeedbackModal({
  type,
  examId,
}: {
  type: 'general' | 'post_exam' | 'result';
  examId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // 🎯 Context-based questions
  const questions = {
    general: 'How is your experience so far?',
    post_exam: 'Did the proctoring feel realistic?',
    result: 'Was the result fair and clear?',
  };

  // ⭐ Emoji ratings
  const ratings = [
    { value: 1, emoji: '😡' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😍' },
  ];

  // ⚡ Auto-open after exam
  useEffect(() => {
    if (type === 'post_exam') {
      setOpen(true);
    }
  }, [type]);

  const submit = async () => {
    if (!rating) return;

    setLoading(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          exam_id: examId,
          rating,
          comment,
        }),
      });

      setSent(true);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button (for general use) */}
      {type === 'general' && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 
           bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl
           hover:bg-blue-700 active:scale-95 transition-all duration-150
           animate-bounce"
>
          💬 Help us improve
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
            >
              ✕
            </button>

            {/* Success state */}
            {sent ? (
              <div className="text-center py-6">
                <p className="text-lg font-semibold">
                  ✅ Thanks for your feedback!
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This helps us improve the simulator.
                </p>
              </div>
            ) : (
              <>
                {/* Question */}
                <h3 className="text-lg font-semibold mb-4 text-center">
                  {questions[type]}
                </h3>

                {/* Emoji rating */}
                <div className="flex justify-center gap-3 text-3xl mb-4">
                  {ratings.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRating(r.value)}
                      className={`transition transform ${
                        rating === r.value
                          ? 'scale-125'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>

                {/* Conditional textarea */}
                {rating && (
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder={
                      rating <= 3
                        ? 'What went wrong?'
                        : 'What did you like?'
                    }
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                )}

                {/* Actions */}
                {rating && (
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium shadow-md 
                              hover:bg-blue-700 active:scale-[0.98] transition-all duration-150
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send feedback'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}