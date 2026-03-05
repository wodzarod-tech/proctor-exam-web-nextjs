"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExamResultComponent from "@/components/ExamResultComponent";

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
    const userAnswers = sessionStorage.getItem("examReview");

    if (!userAnswers) {
      router.push("/");
      return;
    }

    try {
      console.log("userAnswers=", JSON.parse(userAnswers));
      setQuestions(JSON.parse(userAnswers));
    } catch (error) {
      console.error("Failed to parse examReview:", error);
      router.push("/");
    }
  }, []);

  
  if (!questions.length) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <ExamResultComponent
      id={""}
      userAnswers={questions}
      userId={""}
      readOnly
    />
  )
}
