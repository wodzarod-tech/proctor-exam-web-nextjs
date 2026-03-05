"use client";

import styles from "./ExamResultComponent.module.css";
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/***************************
Types
***************************/
interface ExamPreviewProps {
  id: string;
  userAnswers: any;
  userId: string;
  readOnly: boolean;
}

type Question = {
  id: string
  text: string
  type: OptionType
  points: number
  required: boolean
  options: Option[]
  feedbackOk: string
  feedbackError: string
  correctIds: string[]
  userAnswers: string[]
}

type Option = {
  id: string
  text: string
  checked: boolean
}

type OptionType = 'radio' | 'checkbox'

/***************************
Page
***************************/
const ExamResultComponent = ({ id, userAnswers, userId, readOnly = false }: ExamPreviewProps) => {
  console.log('userAnswers=', userAnswers);

  const router = useRouter()

  let formattedQuestions=null;

  if(userAnswers!=null) {
    // Transform Supabase Questions
    const generateId = () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);

    formattedQuestions = userAnswers.map((q: any) => ({
      id: generateId(),
      text: q.text,
      type: q.type,
      points: q.points || 0,
      required: q.required || false,
      feedbackOk: q.feedbackOk || "",
      feedbackError: q.feedbackError || "",
      options: q.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        checked: opt.checked || false,
      })),
      correctIds: q.correctIds || [],
      userAnswers: q.userAnswers || []
    }));
  }
  //
  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card
  const questionsRef = useRef<HTMLDivElement>(null) // for drag & drop
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({}) // for drag & drop

  // Form fields
  const [title, setTitle] = useState(userAnswers?.title ?? '');
  const [description, setDescription] = useState(userAnswers?.description ?? '');
  const [questions, setQuestions] = useState<Question[]>(() =>
    formattedQuestions
  );

  // For results
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  // Active/Desactivate question card
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  // Filter All, Correct and Incorrect questions answered
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");

  const filteredQuestions = questions.filter((q) => {
    const state = getQuestionState(q);

    if (filter === "all") return true;
    if (filter === "correct") return state === "correct";
    if (filter === "incorrect") return state === "incorrect";

    return true;
  });

  // Total points
  const totalPoints = questions?.reduce((sum, q) => sum + (q.points ?? 0), 0) ?? 0;
  const formattedPoints = Number(totalPoints);

/***************************
Effects
***************************/
// Initialize answers on load
useEffect(() => {
  if (!questions) return;

  const initialAnswers: Record<string, string[]> = {};

  questions.forEach(q => {
    const checkedIds = q.options
      .filter(o => o.checked)
      .map(o => o.id);

    if (checkedIds.length > 0) {
      initialAnswers[q.id] = checkedIds;
    }
  });

  setAnswers(initialAnswers);
}, [questions]);

  // auto-adjust textarea when loading existing content
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto"
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
  }
  
/***************************
Actions
***************************/
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

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }

/***************************
Render
***************************/

  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <button className={styles.navBtn} data-tooltip="Back to editor" onClick={() => router.push(`/result/`)}>⬅ Back</button>

      <div>
        <button className={filter === "all" ? styles.activeFilter : ""} onClick={() => setFilter("all")}>📋 All</button>
        <button onClick={() => setFilter("correct")}>✅ Correct</button>
        <button onClick={() => setFilter("incorrect")}>❌ Incorrect</button>
      </div>

    </div>
    </nav>

    <div className={styles.createPage}>
      
      <div className={styles.container} ref={containerRef}>

        {/* Form header */}
        <div className={`${styles.card} ${styles.headerRow}`}>

          <div className={styles.headerTop}>
            <div className={styles.totalPoints}>
              <span>Total points: </span>
              {formattedPoints}
            </div>
          </div>

          <div className={styles.headerFields}>
            <input
              className={`${styles.textUnderlineInput} ${styles.formTitle}`}
              placeholder="Title"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className={`${styles.textUnderlineInput} ${styles.formDescription}`}
              rows={1}
              placeholder="Form description"
              value={description}
              disabled={readOnly}
              onChange={(e) => {
                setDescription(e.target.value)
                // auto-resize
                e.currentTarget.style.height = "auto"
                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
              }}
            />
          </div>
        </div>

          {/* Questions */}
          <div ref={questionsRef} className="space-y-4">
          {filteredQuestions.map((q, index) => {
            const questionState = getQuestionState(q);
          
            return (
              <div key={q.id}
                className={`
                  ${styles.card}
                  ${styles.question}
                  ${activeQuestionId === q.id ? styles.active : ""}
                `}>

                <div className={styles.questionHeader}>

                  <div className={styles.qCounter} style={{
                    fontSize: "13px",
                    color: "#5f6368",
                    marginRight: "auto"
                  }}>
                    {index + 1} de {questions.length}

                    {questionState === "correct" && (
                      <span className={`${styles.badge} ${styles.correct}`}>Correct</span>
                    )}

                    {questionState === "incorrect" && (
                      <span className={`${styles.badge} ${styles.incorrect}`}>Incorrect</span>
                    )}

                    {questionState === "not-answered" && (
                      <span className={`${styles.badge} ${styles.neutral}`}>Not Answered</span>
                    )}
                  </div>

                  <div className={styles.qPoints}>
                    <input
                      type="number"
                      className={styles.pointsInput}
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={q.points}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          points: Number(e.target.value) || 0
                        })
                      }
                    />
                    <span>points</span>
                  </div>
                </div>

                <textarea
                  className={`${styles.textUnderlineInput} ${styles.qTitle}`}
                  rows={1}
                  placeholder="Question"
                  value={q.text}
                  disabled={readOnly}
                  onChange={(e) => {
                    updateQuestion(q.id, { text: e.target.value })
                    autoResize(e)
                  }}
                />

                {/* Options */}
                <div
                  ref={(el) => {
                    optionRefs.current[q.id] = el
                  }}
                >
                  {q.options.map((opt: any) => {
                    const state = getOptionState(opt.id, q);

                    let className = "reviewOption";
                    if (state === "correct") className += " correct";
                    if (state === "incorrect") className += " incorrect";
                    if (state === "missed") className += " missed"

                    return (
                      <div key={opt.id}
                        className={`${styles.reviewOption} ${styles[state]} ${styles.option}`}>

                        <input
                          className={styles.optIcon}
                          type={q.type}
                          checked={q.userAnswers?.includes(opt.id)}
                        />

                        <textarea
                          className={styles.textUnderlineInput}
                          rows={1}
                          value={opt.text}
                          disabled={readOnly}
                          onChange={(e) => {
                            updateQuestion(q.id, {
                              options: q.options.map(o =>
                                o.id === opt.id
                                  ? { ...o, text: e.target.value }
                                  : o
                              )
                            })
                            autoResize(e)
                          }}
                        />
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
                </div>
        
                <div className={styles.lineSeparator} />
  
                {/* Feedback */}
                <textarea
                  className={`${styles.textUnderlineInput} ${styles.feedback} ${styles.feedbackOkLabel}`}
                  value={q.feedbackOk}
                  onChange={(e) => {
                    autoResize(e)
                  }}
                />

                <textarea
                  className={`${styles.textUnderlineInput} ${styles.feedback} ${styles.feedbackErrorLabel}`}
                  value={q.feedbackError}
                  onChange={(e) => {
                    autoResize(e)
                  }}
                />

                <div className={styles.lineSeparator} />

                <div className={styles.questionFooter}>
                  <div className={styles.footerActions}>
                    <div className={styles.requiredToggle}>
                      <span className={styles.gfLabel}>Required</span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={q.required}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateQuestion(q.id, { required: e.target.checked })
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                  </div>
                </div>
              </div>
              )
          })}
        </div>
      </div>
    </div>
    </>
  )
}
export default ExamResultComponent