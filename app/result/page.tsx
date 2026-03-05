'use client'
import "./result.css"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ResultPage() {

  const router = useRouter()

  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [scoreMin, setScoreMin] = useState(0)

  useEffect(() => {
    const storedScore = sessionStorage.getItem("examScore")
    const storedTotal = sessionStorage.getItem("examTotal")
    const storedScoreMin = sessionStorage.getItem("scoreMin")

    if (storedScore) setScore(Number(storedScore))
    if (storedTotal) setTotal(Number(storedTotal))
    if (storedScoreMin) setScoreMin(Number(storedScoreMin))
  }, [])

  const percentage =
    total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    </div>
    </nav>

    <div className="card">
      <h2><strong>Exam Result</strong></h2>

      <div className="score">
        {score} / {total} points ({percentage}%)
      </div>

      <div className="progressBar">
        <div
          className="progressFill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <p>
        {score >= scoreMin
          ? "✅ Congratulations! You passed."
          : "❌ You did not reach the minimum score (" + scoreMin + " points.)"}
      </p>

      <button className="resultsBtn" onClick={() => router.push("/result/details")}>
        📊 See results
      </button>

      <button className="homeBtn" onClick={() => router.push("/")}>
        🏠 Home
      </button>
    </div>
    </>
  )
}
