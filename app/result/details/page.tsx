"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================
   Helpers
========================= */

function getOptionState(optId: string, q: any) {
  const correctIds = q.correctIds || [];
  const userAnswers = q.userAnswers || [];

  const isCorrect = correctIds.includes(optId);
  const isSelected = userAnswers.includes(optId);

  if (isCorrect && isSelected) return "correct";
  if (!isCorrect && isSelected) return "incorrect";
  if (isCorrect && !isSelected) return "missed";
  return "neutral";
}

function getQuestionState(q: any) {
  const correctIds = q.correctIds || [];
  const selected = q.userAnswers || [];

  if (selected.length === 0) {
    return "not-answered";
  }

  const isCorrect =
    correctIds.length === selected.length &&
    correctIds.every((id: string) => selected.includes(id));

  return isCorrect ? "correct" : "incorrect";
}

/* =========================
   Component
========================= */

export default function ResultDetailsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("examReview");

    if (!stored) {
      router.push("/");
      return;
    }

    try {
      setQuestions(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to parse examReview:", error);
      router.push("/");
    }
  }, []);

  if (!questions.length) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Detailed Results</h2>

      {questions.map((q, index) => {
        const questionState = getQuestionState(q);

        return (
          <div
            key={q.id}
            style={{
              marginBottom: 30,
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <h3>
              {index + 1}. {q.text}

              {questionState === "correct" && (
                <span className="badge correct">Correct</span>
              )}

              {questionState === "incorrect" && (
                <span className="badge incorrect">Incorrect</span>
              )}

              {questionState === "not-answered" && (
                <span className="badge neutral">Not Answered</span>
              )}
            </h3>

            {/* Options */}
            {q.options?.map((opt: any) => {
              const state = getOptionState(opt.id, q);

              let className = "review-option";
              if (state === "correct") className += " correct";
              if (state === "incorrect") className += " incorrect";
              if (state === "missed") className += " missed";

              return (
                <div key={opt.id} className={className}>
                  <span>{opt.text}</span>

                  {state === "correct" && (
                    <span className="icon">✔</span>
                  )}
                  {state === "incorrect" && (
                    <span className="icon">✖</span>
                  )}
                  {state === "missed" && (
                    <span className="icon">✔</span>
                  )}
                </div>
              );
            })}

            {/* Feedback */}
            {questionState === "correct" && q.feedbackOk && (
              <div className="feedback feedback-ok">
                {q.feedbackOk}
              </div>
            )}

            {(questionState === "incorrect" ||
              questionState === "not-answered") &&
              q.feedbackError && (
                <div className="feedback feedback-error">
                  {q.feedbackError}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}
