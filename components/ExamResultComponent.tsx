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
        id: generateId(),
        text: opt.text,
        checked: opt.checked || false,
      })),
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
  function addQuestion() {
    setQuestions(qs => [
      ...qs,
      {
        id: uid(),
        text: '',
        type: 'radio',
        points: 0,
        required: false,
        options: [{ id: uid(), text: '', checked: false }],
        feedbackOk: '',
        feedbackError: ''
      }
    ])
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }

/***************************
Render
***************************/

  return (
    <>  
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
          {questions.map((q, index) => {
              return (
                <div key={q.id} className={`${styles.card} ${styles.question} ${activeQuestionId === q.id ? styles.active : ""}`}

                onClick={() => {
                  if (readOnly) return;
                  setActiveQuestionId(q.id)
                }}>

                <div className={styles.questionHeader}>

                  <div className={styles.qCounter} style={{
                    fontSize: "13px",
                    color: "#5f6368",
                    marginRight: "auto"
                  }}>
                    {index + 1} de {questions.length}
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

                <div
                  ref={(el) => {
                    optionRefs.current[q.id] = el
                  }}
                >
                  {q.options.map((opt, index) => (
                    <div key={opt.id} className={styles.option}>

                      <input
                        className={styles.optIcon}
                        type={q.type}
                        name={q.type === 'radio' ? q.id : undefined}
                        checked={answers[q.id]?.includes(opt.id) || false}
                        onChange={() => {
                          setAnswers(prev => {
                            const current = prev[q.id] || [];

                            if (q.type === "radio") {
                              return {
                                ...prev,
                                [q.id]: [opt.id]
                              };
                            }

                            // checkbox
                            if (current.includes(opt.id)) {
                              return {
                                ...prev,
                                [q.id]: current.filter(id => id !== opt.id)
                              };
                            } else {
                              return {
                                ...prev,
                                [q.id]: [...current, opt.id]
                              };
                            }
                          });
                        }}
                      />

                      <textarea
                        className={styles.textUnderlineInput}
                        rows={1}
                        placeholder={`Option ${index + 1}`}
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
                    </div>
                  ))}
                </div>
        
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