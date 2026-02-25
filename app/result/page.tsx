'use client'
import "./result.css"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ResultPage() {

  const router = useRouter()

  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const storedScore = sessionStorage.getItem("examScore")
    const storedTotal = sessionStorage.getItem("examTotal")

    if (storedScore) setScore(Number(storedScore))
    if (storedTotal) setTotal(Number(storedTotal))
  }, [])

  const percentage =
    total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <div className="card">
      <h2><strong>Exam Result</strong></h2>

      <div className="score">
        {score} / {total} ({percentage}%)
      </div>

      <p>
        {percentage >= 70
          ? "✅ Congratulations! You passed."
          : "❌ You did not reach the minimum score (70%)."}
      </p>

      <button onClick={() => router.push("/result/details")}
        style={{ marginRight: "12px" }}>
        📊 See results
      </button>

      <button onClick={() => router.push("/")}>
        🏠 Home
      </button>
    </div>
  )
}
