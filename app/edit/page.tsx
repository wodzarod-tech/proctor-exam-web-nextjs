'use client'
import "./edit.css"

import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { createExam } from "@/lib/actions/exam.actions"

/* =====================
   Types
===================== */
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

type Settings = {
  general: {
    shuffleQuestions: boolean
    shuffleOptions: boolean
    viewToggleQuestions: boolean
    viewQuestions: boolean
    scoreMin: number
  }
  timer: {
    hours: number
    minutes: number
  }
  camera: {
    enabled: boolean
    faceAbsence: boolean
    eyeTracking: boolean
  }
  microphone: {
    enabled: boolean
    loudNoise: boolean
  }
  screen: {
    tabSwitch: boolean
    fullscreenExit: boolean
    devToolsOpen: boolean
    leaveFullScreen: boolean
    blockKeyShortcuts: boolean
    secondMonitor: boolean
  }
}

/* =====================
   Helpers
===================== */
const uid = () => crypto.randomUUID()

const createEmptyQuestion = (): Question => ({
  id: uid(),
  text: '',
  type: 'radio',
  points: 0,
  required: false,
  options: [
    { id: uid(), text: '', checked: false }
  ],
  feedbackOk: '',
  feedbackError: ''
})

/* =====================
   Page
===================== */
export default function CreatePage() {
  const router = useRouter()

  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card
  const questionsRef = useRef<HTMLDivElement>(null) // for drag & drop
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({}) // for drag & drop

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion()
  ])
  const [settings, setSettings] = useState<Settings>({
    general: {
      shuffleQuestions: false,
      shuffleOptions: false,
      viewToggleQuestions: false,
      viewQuestions: false,
      scoreMin: 0,
    },
    timer: {
      hours: 0,
      minutes: 0,
    },
    camera: {
      enabled: false,
      faceAbsence: false,
      eyeTracking: false,
    },
    microphone: {
      enabled: false,
      loudNoise: false,
    },
    screen: {
      tabSwitch: false,
      fullscreenExit: false,
      devToolsOpen: false,
      leaveFullScreen: false,
      blockKeyShortcuts: false,
      secondMonitor: false,
    },
  })

  // Open/Close Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Active/Desactivate question card
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const formattedPoints = Number(totalPoints);

  /* =====================
     Effects
  ===================== */
  // drag & drop a question card
  useEffect(() => {
    if (!questionsRef.current) return

    const sortable = new Sortable(questionsRef.current, {
      handle: '.drag',
      animation: 150,
      onEnd: (evt) => {
        setQuestions(prev => {
          const reordered = [...prev]
          const [moved] = reordered.splice(evt.oldIndex!, 1)
          reordered.splice(evt.newIndex!, 0, moved)
          return reordered
        })
      }
    })

    return () => {
      sortable.destroy()
    }
  }, [])

  // drag & drop options
  useEffect(() => {
    const sortables: Sortable[] = []

    Object.entries(optionRefs.current).forEach(([qid, el]) => {
      if (!el) return

      const sortable = new Sortable(el, {
        handle: '.opt-drag',
        animation: 150,
        onEnd: (evt) => {
          setQuestions(prev =>
            prev.map(q => {
              if (q.id !== qid) return q

              const reordered = [...q.options]
              const [moved] = reordered.splice(evt.oldIndex!, 1)
              reordered.splice(evt.newIndex!, 0, moved)

              return { ...q, options: reordered }
            })
          )
        }
      })

      sortables.push(sortable)
    })

    return () => {
      sortables.forEach(s => s.destroy())
    }
  }, [questions])

  // Click-outside effect to deselect active question card
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return

      const target = e.target as HTMLElement

      // If click is NOT inside a question card
      if (!target.closest('.card.question')) {
        setActiveQuestionId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // auto-adjust textarea when loading existing content
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto"
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
  }

  /* =====================
     Actions
  ===================== */
  async function saveExam() {
    try {
      const examPayload = {
        title,
        description,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          points: q.points,
          required: q.required,
          options: q.options.map(o => ({
            text: o.text,
            checked: o.checked
          })),
          feedbackOk: q.feedbackOk,
          feedbackError: q.feedbackError
        })),
        settings
      }

      console.log('examPayload=',examPayload)
      //const createdExam = await createExam(examPayload)

      alert("Exam saved successfully ✅")

    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to save exam")
    }
  }

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

  function addOption(qid: string) {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== qid) return q

        const optionNumber = q.options.length + 1

        return {
          ...q,
          options: [
            ...q.options,
            {
              id: uid(),
              text: "",
              checked: false
            }
          ]
        }
      })
    )
  }

  function removeOption(qid: string, oid: string) {
    setQuestions(prev =>
      prev.map(q =>
        q.id === qid && q.options.length > 1
          ? { ...q, options: q.options.filter(o => o.id !== oid) }
          : q
      )
    )
  }

  /* =====================
     Render
  ===================== */
  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3">
        <Image
            src="/images/logo.png"
            alt="EasyExam logo"
            width={46}
            height={44}
            priority
        />
        <span className="text-2xl font-semibold tracking-tight">
            EasyExam
        </span>
        </Link>

        <div className="flex items-center gap-8">
        
        {/* NavItems */}
        <nav className="toolbar-nav">
          <button className="g-tooltip" data-tooltip="Add question" onClick={addQuestion}><i className="fa fa-plus"></i></button>
          <button className="g-tooltip" data-tooltip="Import Exam"><i className="fa fa-upload"></i></button>
          <button className="g-tooltip" data-tooltip="Save Exam" onClick={saveExam}><i className="fa fa-save"></i></button>
          <button className="g-tooltip" data-tooltip="Settings" onClick={() => setIsSettingsOpen(true)}><i className="fa fa-gear"></i></button>
          <button className="g-tooltip" data-tooltip="Preview exam" onClick={() => router.push("/preview")}><i className="fa fa-eye"></i></button>
          <button className="g-tooltip" data-tooltip="Delete exam"><i className="fa fa-trash"></i></button>
          <button className="toolbar-btn primary">Publish</button>
        </nav>

        <SignedOut>
            <SignInButton>
            <button className="btn-signin">Sign In</button>
            </SignInButton>
        </SignedOut>

        <SignedIn>
            <UserButton />
        </SignedIn>
        </div>
    </div>
    </nav>

    <div className="create-page">
      
      <div className="container" ref={containerRef}>

        {/* Form header */}
        <div className="card header-row">

          <div className="header-top">
            <div className="total-points">
              <span>Total points: </span>
              {formattedPoints}
            </div>
          </div>

          <div className="header-fields">
            <input
              className="text-underline-input form-title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="text-underline-input form-description"
              rows={1}
              placeholder="Form description"
              value={description}
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
          {questions.map((q, index) => (
            <div key={q.id} className={`card question ${activeQuestionId === q.id ? "active" : ""}`}
              onClick={() => setActiveQuestionId(q.id)}>

              <div className="drag">: : :</div>

              <div className="question-header">

                <div className="q-counter" style={{
                  fontSize: "13px",
                  color: "#5f6368",
                  marginRight: "auto"
                }}>
                  {index + 1} de {questions.length}
                </div>

                <div className="q-points">
                  <input
                    type="number"
                    className="points-input"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={q.points}
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
                className="text-underline-input q-title"
                rows={1}
                placeholder="Question"
                value={q.text}
                onChange={(e) => {
                  updateQuestion(q.id, { text: e.target.value })
                  autoResize(e)
                }}
              />

              <select className="q-type"
                value={q.type}
                onChange={(e) =>
                  updateQuestion(q.id, {
                    type: e.target.value as OptionType
                  })
                }
              >
                <option value="radio">◉ One choice</option>
                <option value="checkbox">☑ Multiple choices</option>
              </select>

              <div
                ref={(el) => {
                  optionRefs.current[q.id] = el
                }}
              >
                {q.options.map((opt, index) => (
                  <div key={opt.id} className="option">

                    <div className="opt-drag">⋮⋮</div>

                    <input
                      className="opt-icon"
                      type={q.type}
                      name={q.type === 'radio' ? q.id : undefined}
                      checked={opt.checked}
                      onChange={() => {
                        updateQuestion(q.id, {
                          options: q.options.map(o =>
                            q.type === 'radio'
                              ? { ...o, checked: o.id === opt.id }
                              : o.id === opt.id
                                ? { ...o, checked: !o.checked }
                                : o
                          )
                        })
                      }}
                    />

                    <textarea
                      className="text-underline-input"
                      rows={1}
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
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

                    <button
                      className="btn-link"
                      onClick={() => removeOption(q.id, opt.id)}
                    >
                      ✕
                    </button>

                  </div>
                ))}
              </div>

              <div>
                <button className="btn-link" onClick={() => addOption(q.id)}>Add option</button>
              </div>
    
              <div className="line-separator" />
  
              <div className="feedback-ok-label">
                <span className="feedback-icon">✔</span>
                <span>Feedback Correct:</span>
              </div>

              <textarea
                className="text-underline-input"
                rows={1}
                placeholder="Feedback"
                value={q.feedbackOk}
                onChange={(e) => {
                  updateQuestion(q.id, { feedbackOk: e.target.value })
                  autoResize(e)
                }}
              />

              <div className="feedback-error-label">
                <span className="feedback-icon">✖</span>
                <span>Feedback Incorrect:</span>
              </div>

              <textarea
                className="text-underline-input"
                rows={1}
                placeholder="Feedback"
                value={q.feedbackError}
                onChange={(e) => {
                  updateQuestion(q.id, { feedbackError: e.target.value })
                  autoResize(e)
                }}
              />

              <div className="line-separator" />

              <div className="question-footer">
                <div className="footer-actions">

                  <div className="tooltip-wrapper">
                    <button
                      className="icon-btn"
                      onClick={() =>
                        setQuestions(prev => prev.filter(x => x.id !== q.id))
                      }
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                    <span className="tooltip-text">Delete question</span>
                  </div>

                  <div className="vertical-divider"></div>

                  <div className="required-toggle">
                    <span className="required-label">Required</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          updateQuestion(q.id, { required: e.target.checked })
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
      
      {/* Settings Modal */}
      <div className={`settings-modal ${!isSettingsOpen ? "hidden" : ""}`}>
        
        <div className="settings-card">

          <div className="settings-header">
            <h3>Settings</h3>
            <button className="btn-icon" onClick={() => setIsSettingsOpen(false)}>✕</button>
          </div>
          
          <div className="settings-content">

              <div className="gf-toggle-row">
                <span className="gf-label">
                  Shuffle questions
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.general.shuffleQuestions}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          shuffleQuestions: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row">
                <span className="gf-label">
                  Shuffle options
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.general.shuffleOptions}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          shuffleOptions: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row">
                <span className="gf-label">
                  View toggle One by One/All questions
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.general.viewToggleQuestions}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          viewToggleQuestions: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row">
                <span className="gf-label">
                  View questions One by One
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    data-proctor="view-questions"
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row">
                <span className="gf-label">
                  Points minimum to pass
                </span>

                <div className="q-points">
                  <input
                    type="number"
                    className="points-input"
                    min="0"
                    step="0.1"
                    value={settings.general.scoreMin}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0
                      setSettings(prev => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          scoreMin: value
                        }
                      }))
                    }}
                  /> points
                </div>
              </div>
            
              <div className="line-separator" />

              <div>
                <span className="gf-label">
                  <h2><strong>PROCTOR</strong></h2>
                </span>
              </div>

              {/* Timer */}
              <div className="gf-toggle-row">
                <span className="gf-label">
                  Timer Left
                </span>

                <div className="q-points">
                  <input
                    type="number"
                    className="points-input"
                    min="0"
                    max="24"
                    step="1"
                    value={settings.timer.hours}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(24, Number(e.target.value)))
                      setSettings(prev => ({
                        ...prev,
                        timer: {
                          ...prev.timer,
                          hours: value
                        }
                      }))
                    }}
                  />hour
                  <span>:</span>
                  <input
                    type="number"
                    className="points-input"
                    min="0"
                    max="59"
                    step="1"
                    value={settings.timer.minutes}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(59, Number(e.target.value)))
                      setSettings(prev => ({
                        ...prev,
                        timer: {
                          ...prev.timer,
                          minutes: value
                        }
                      }))
                    }}
                  />min
                </div>
              </div>

              {/* Camera */}
              <div className="gf-toggle-row">
                <span className="gf-label">
                  Camera
                </span>
                <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.camera.enabled}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      camera: {
                        ...prev.camera,
                        enabled: e.target.checked
                      }
                    }))
                  }
                />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Detect Face absence
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.camera.faceAbsence}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        camera: {
                          ...prev.camera,
                          faceAbsence: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Eye-Tracking: Gaze Direction
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.camera.eyeTracking}
                    onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      camera: {
                        ...prev.camera,
                        eyeTracking: e.target.checked
                      }
                    }))
                  }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Microphone */}
              <div className="gf-toggle-row">
                <span className="gf-label">
                  Microphone
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.microphone.enabled}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        microphone: {
                          ...prev.microphone,
                          enabled: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Noise-detection: Detect loud background noise
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.microphone.loudNoise}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        microphone: {
                          ...prev.microphone,
                          loudNoise: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Screen */}
              <div>
                <span className="gf-label">
                  Screen
                </span>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Detect tab switching or minimize
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.tabSwitch}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          tabSwitch: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Detect fullscreen exit
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.fullscreenExit}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          fullscreenExit: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Detect DevTools Opening
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.devToolsOpen}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          devToolsOpen: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Detect leaving fullscreen
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.leaveFullScreen}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          leaveFullScreen: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Block Keyboard Shortcuts
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.blockKeyShortcuts}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          blockKeyShortcuts: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="gf-toggle-row sub-setting">
                <span className="gf-label">
                  Fake "Second Monitor Detection"
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screen.secondMonitor}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        screen: {
                          ...prev.screen,
                          secondMonitor: e.target.checked
                        }
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
