'use client'
import "./result.css"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import FeedbackModal from "@/components/feedback/FeedbackModal"

export default function ResultPage() {

  const router = useRouter()

  const [userId, setUserId] = useState("")
  const [examId, setExamId] = useState("")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [scoreMin, setScoreMin] = useState(0)
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  // get values
  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    const examId = sessionStorage.getItem("examId")
    if (userId) setUserId(userId)
    if (examId) setExamId(examId)

    const storedScore = sessionStorage.getItem("examScore")
    const storedTotal = sessionStorage.getItem("examTotal")
    const storedScoreMin = sessionStorage.getItem("scoreMin")

    if (storedScore) setScore(Number(storedScore))
    if (storedTotal) setTotal(Number(storedTotal))
    if (storedScoreMin) setScoreMin(Number(storedScoreMin))
  }, [])

  // trigger confetti if passed
  useEffect(() => {
    if (score >= scoreMin && scoreMin !== 0) {
      setTimeout(() => {
        fireConfetti()
      }, 500)
    }

  }, [score, scoreMin])

  function fireConfetti() {
    const duration = 3000
    const animationEnd = Date.now() + duration

    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 1000
    }

    function randomInRange(min:number, max:number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {

      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })

    }, 250)
  }

  const [hover, setHover] = useState(false);
  
  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button 
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          background: hover ? "rgba(10, 77, 233, 0.1)" : "#f1f3f4",
          border: "1px solid #dadce0",
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
        data-tooltip="Back to Home" 
        onClick={async () => {
          window.location.href = `/`
        }}>⬅ Home</button>
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
          ? "✅ Congratulations! You passed. Minimum score (" + scoreMin + " points)"
          : "❌ You did not reach the minimum score (" + scoreMin + " points)"}
      </p>

      <button className="resultsBtn" onClick={() => router.push("/result/details")}>
        📊 See results
      </button>

      {/*<button className="homeBtn" onClick={() => router.push("/")}>
        🏠 Home
      </button>*/}
    </div>

    <FeedbackModal 
      userId={userId}
      examId={examId}
    />
    </>
  )
}
