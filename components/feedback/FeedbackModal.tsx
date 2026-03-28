'use client';
import { User } from "@supabase/supabase-js";
import styles from "./FeedbackModal.module.css";

import { useEffect, useState } from 'react';
import { getUserProfile } from "@/lib/auth/user-client";

/*
type Profile = {
  name?: string;
  email?: string;
};*/

type Props = {
  userId?: string;
  examId?: string;
  //profile: Profile | null;
};

export default function FeedbackModal({ userId, examId }: Props) {

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // ⭐ Emoji ratings
  const ratings = [
    { value: 1, emoji: '😡' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😍' },
  ];

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
          user_id: userId || null,
          exam_id: examId || null,
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
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: "50%",
          right: "0",
          transform: "translateY(-50%)",
          width: "28px",
          height: "130px",
          backgroundColor: "#4B5563", // gray-700
          color: "white",
          borderTopLeftRadius: "50px",
          borderBottomLeftRadius: "50px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1f2937"; // darker
          e.currentTarget.style.width = "35px"; // expand
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#4B5563"; // original
          e.currentTarget.style.width = "28px"; // back
        }}
      >
        <span
          style={{
            transform: "rotate(-90deg)",
            whiteSpace: "nowrap",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          💬 Feedback
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className={styles.settingsModal}
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.settingsCard}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }} // 👈 needed for absolute button
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                fontSize: "18px",
                color: "#9ca3af",
                cursor: "pointer",
                background: "none",
                border: "none",
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div
              style={{
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {sent ? (
                <>
                  <p style={{ fontSize: "18px", fontWeight: 600 }}>
                    ✅ Thanks for your feedback!
                  </p>
                  <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
                    This helps us improve the simulator.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                    How is your experience so far?
                  </h3>

                  {/* Emoji rating */}
                  <div style={{ display: "flex", gap: "12px", fontSize: "28px", marginBottom: "16px" }}>
                    {ratings.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRating(r.value)}
                        style={{
                          transform: rating === r.value ? "scale(1.25)" : "scale(1)",
                          opacity: rating === r.value ? 1 : 0.5,
                          transition: "all 0.2s",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                        }}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>

                  {/* Textarea */}
                  {rating && (
                    <textarea
                      style={{
                        width: "100%",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "8px",
                        fontSize: "14px",
                        marginBottom: "16px",
                      }}
                      placeholder={
                        rating <= 3
                          ? "What went wrong?"
                          : "What did you like?"
                      }
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  )}

                  {/* Button */}
                  {rating && (
                    <button
                      onClick={submit}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#2563eb",
                        color: "white",
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Sending..." : "Send feedback"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}