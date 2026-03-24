"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExamResultComponent from "@/components/ExamResultComponent";

export default function ResultDetailsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("")
  const [examId, setExamId] = useState("")
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    const examId = sessionStorage.getItem("examId")
    if (userId) setUserId(userId)
    if (examId) setExamId(examId)

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
      id={examId}
      userAnswers={questions}
      userId={userId}
      readOnly
    />
  )
}
