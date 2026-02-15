'use client'
import "./preview.css"

import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import ExamCard from '@/components/ExamCard'
import TitleCard from '@/components/TitleCard'
import QuestionCard from '@/components/QuestionCard2'

/* =====================
   Types
===================== */

type Option = {
  id: string
  text: string
  checked: boolean
}

type QuestionType = 'radio' | 'checkbox'

type Question = {
  id: string
  text: string
  type: QuestionType
  points: number
  required: boolean
  options: Option[]
  feedbackOk: string
  feedbackError: string
}

type ProctorSettings = {
  general: {
    shuffleQuestions: boolean
    shuffleOptions: boolean
    viewToggleQuestions: boolean
    viewQuestions: boolean
    scoreMin: number
  }
  timer: {
    enabled: boolean
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

export default function PreviewExam() {
  const router = useRouter()
  const questionsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card

  {/*enableOptionDrag (Sortable per question) */}
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    createEmptyQuestion()
  ])
  const [settings, setSettings] = useState<ProctorSettings | null>(null)
  const [isSettingsDirty, setIsSettingsDirty] = useState(false) // Track if settings have unsaved changes

  const [isProctorOpen, setIsProctorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showScoreMin, setShowScoreMin] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [scoreMinValue, setScoreMinValue] = useState(0)

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)

  /* =====================
     Derived
  ===================== */

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  /* =====================
     Effects
  ===================== */

  // Auto-save JSON
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('formContent', JSON.stringify(exportJSON(), null, 2))
    }, 1500)

    return () => clearTimeout(timeout)
  }, [title, description, questions, settings])

// Enable Sortable (questions): when drag & drop a question card
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

// Replace enableOptionDrag(opt) and options._sortable = new Sortable(...)
useEffect(() => {
  Object.entries(optionRefs.current).forEach(([qid, el]) => {
    if (!el || (el as any)._sortable) return

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

    ;(el as any)._sortable = sortable
  })
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

  /* =====================
     Actions
  ===================== */

  function prevQuestion() {

  }

  function nextQuestion() {
    
  }

  function submitExam() {

  }

  function filterResults(qid: string) {
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

  function exportJSON() {
    return {
      title,
      description,
      questions,
      settings
    }
  }

  function saveProctorSettings(){

  alert("Settings saved successfully");
}

  function toggleToolbar() {
    setIsToolbarCollapsed(prev => !prev)
  }

  function updateSetting<K extends keyof ProctorSettings>(
    key: K,
    value: ProctorSettings[K]
  ) {
    setSettings(prev => {
      if (!prev) return prev

      return {
        ...prev,
        [key]: value
      }
    })

    setIsSettingsDirty(true)
  }

  /* =====================
     Render
  ===================== */

  return (
    <div>
    {/*<div className="min-h-screen bg-background text-foreground">*/}

      <header className="h-2 bg-primary" />

      {/* Webcam */}
      <div id="webcam">
        <div id="timer">Time Left: --:--:--</div>
        <video id="video" autoplay muted playsinline></video>
        <canvas id="overlay" className="overlay"></canvas> {/* <!-- face detection */}
      </div>

      <div className="container" ref={containerRef}>

        {/* Options header */}
        <div className="preview-topbar">
          <button id="goBack" className="nav-btn" data-tooltip="Back to editor" onClick={() => router.push("/create")}>⬅ Back</button>
          
          <div id="resultFilters" style={{ display: "flex", margin: "12px 0", gap: "8px" }}>
            <button onClick={() => filterResults('all')}>📋 All</button>
            <button onClick={() => filterResults('correct')}>✅ Correct</button>
            <button onClick={() => filterResults('incorrect')}>❌ Incorrect</button>
          </div>

          <button id="goResults" className="nav-btn" data-tooltip="Back to results" style={{ display: "flex" }} onClick={() => router.push("/result")}>Back to results ➡</button>

          <div className="view-toggle" id="viewToggle" style={{ display: "flex" }}>
            <span>View:</span>

            <label className="switch"> 
              <input type="checkbox" id="oneByOneToggle" />
              <span className="slider"></span>
            </label>

            <span>One by one</span>
          </div>
        </div>

        {/* Form header */}
        <div className="card form-header">
          <div className="form-header-row">
            <div>
              <input className="title-input" id="formTitle" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/>
              <input className="desc-input" id="formDesc" placeholder="Form description 2" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="total-points">
              <span>Total points</span>
              <strong id="totalPoints">{totalPoints.toFixed(1)}</strong>
            </div>
          </div>
        </div>

          {/* Questions */}
          {/*<div id="questions"></div>*/}
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

                <button
                  className="btn-link g-tooltip delete-top"
                  data-tooltip="Delete question"
                  onClick={() =>
                    setQuestions(prev => prev.filter(x => x.id !== q.id))
                  }
                ><i className="fa fa-trash"></i></button>

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
                className="q-title"
                placeholder="Question"
                value={q.text}
                onChange={(e) =>
                  updateQuestion(q.id, { text: e.target.value })
                }
              />

              <select className="q-type"
                value={q.type}
                onChange={(e) =>
                  updateQuestion(q.id, {
                    type: e.target.value as QuestionType
                  })
                }
              >
                <option value="radio">◉ One choice</option>
                <option value="checkbox">☑ Multiple choices</option>
              </select>

              {/*<div className="options"></div>*/}
              <div
                className="options"
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
                      className="opt-text"
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
                        // auto-resize
                        e.currentTarget.style.height = "auto"
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
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
    
              <div className="option-separator" />

              {/* Toggle header */}
              {/*
              <div className="feedback-toggle" onClick={() => toggleFeedback(q.id)}>
                <span className="feedback-toggle-icon">▼</span>
                <span className="feedback-toggle-text">Answer feedback</span>
              </div>*/}

              {/* Collapsible content */}
              
              <div className="feedback" style={{display:"none"}}>

                <div className="feedback-group ok">
                  <div className="feedback-ok-label">
                    <span className="feedback-icon">✔</span>
                    <span>Correct:</span>
                  </div>
                  <textarea className="q-comment" rows={1} placeholder="Feedback"></textarea>
                </div>

                <div className="feedback-group error">
                  <div className="feedback-error-label">
                    <span className="feedback-icon">✖</span>
                    <span>Incorrect:</span>
                  </div>
                  <textarea className="q-comment" rows={1} placeholder="Feedback"></textarea>
                </div>

              </div>

              <div className="actions">
                <div className="required-toggle">
                  <span>Required</span>
                  <label className="switch">
                    <input type="checkbox" className="q-required" onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div id="questionNav" className="question-nav">
          <div id="navCenter" className="nav-center">
            <button id="prevBtn" className="nav-btn" onClick={prevQuestion}>⬅ Previous</button>
            <button id="nextBtn" className="nav-btn" onClick={nextQuestion}>Next ➡</button>
          </div>

          <button id="submitBtn" onClick={submitExam}>Submit</button>
        </div>

      </div>

      {/* Bottom toolbar */}
      <div
        id="gformsToolbar"
        className={`gforms-toolbar bottom ${isToolbarCollapsed ? 'collapsed' : ''}`}
      >
        {/* Handle */}
        <div 
          className="toolbar-handle g-tooltip"
          id="toolbarHandle"
          data-tooltip={isToolbarCollapsed ? "Open panel" : "Close panel"}
          onClick={toggleToolbar}>
            {isToolbarCollapsed ? "▲" : "▼"}
        </div>

        <div className="toolbar-buttons">
          <button className="g-tooltip" data-tooltip="Add question" onClick={addQuestion}>+</button>
          <button className="g-tooltip" data-tooltip="Import Exam" onClick={addQuestion}>📂</button>
          <button className="g-tooltip" data-tooltip="Export Exam" onClick={addQuestion}>💾</button>
          <button className="g-tooltip" data-tooltip="Settings" onClick={() => setIsProctorOpen(true)}>⚙️</button>
          <button className="g-tooltip" data-tooltip="Preview exam" onClick={() => router.push("/preview")}>👁️</button>
          <button className="g-tooltip" data-tooltip="Home" onClick={() => router.push('/')}>🏠</button>
        </div>
      </div>

      {/* hidden file input */}
      <input
        type="file"
        id="jsonFileInput"
        accept="application/json"
        hidden
      />

      {/* Proctor Modal */}
      <div className={`proctor-modal ${!isProctorOpen ? "hidden" : ""}`}>
        <div className="proctor-card">

          <div className="proctor-header">
            <h3>Settings</h3>
            <button className="btn-icon" onClick={() => setIsProctorOpen(false)}>✕</button>
          </div>

          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button className={activeTab === "general" ? "tab active" : "tab"} onClick={() => setActiveTab("general")}>General</button>
            <button className={activeTab === "proctor" ? "tab active" : "tab"} onClick={() => setActiveTab("proctor")}>Proctor 🛡️</button>
          </div>

          {/* Tab contents */}
          <div className="settings-content">

            {/* General Settings */}
            {activeTab === "general" && (
              <div className="tab-panel">
              <label className="toggle-row"><strong>General:</strong></label>
              <label className="toggle-row" style={{ display:"none" }}>
                <input type="checkbox" data-proctor="shuffle-questions" />
                <span>Shuffle questions</span>
              </label>

              <label className="toggle-row" style={{ display:"none" }}>
                <input type="checkbox" data-proctor="shuffle-options" />
                <span>Shuffle options</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" id="viewToggleQuestions" data-proctor="view-toggle-questions" />
                <span>View toggle questions (One by One/All)</span>
              </label>
              
              <label className="toggle-row">
                <input type="checkbox" data-proctor="view-questions" />
                <span>View questions One by One</span>
              </label>

              <div className="toggle-inline">
                <label className="toggle-row">
                  <input type="checkbox" data-proctor="score-min" checked={showScoreMin}
                    onChange={(e) => setShowScoreMin(e.target.checked)} />
                  <span>Points/Score minimum to pass</span>
                </label>

                <div
                  className="score-row"
                  style={{ display: showScoreMin ? "flex" : "none" }}>
                    <input
                      type="number"
                      className="score-input"
                      min="0"
                      step="1"
                      value={scoreMinValue}
                      onChange={(e) => setScoreMinValue(Number(e.target.value) || 0)}
                    /> points
                </div>
              </div>
            </div>)}
            
            {/* Proctor Settings */}
            {activeTab === "proctor" && (
            <div className="tab-panel" id="tab-proctor">

              {/* Timer */}
              <label className="toggle-row"><strong>Timer:</strong></label>

              <div className="toggle-inline">
                <label className="toggle-row">
                  <input type="checkbox" data-proctor="timer-enabled" checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}/>
                  <span>Timer Left</span>
                </label>

                {timerEnabled && (
                <div className="timer-row">
                  <input
                    type="number"
                    className="timer-input timer-input-hours"
                    min="0"
                    max="24"
                    step="1"
                    value={hours}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(24, Number(e.target.value)))
                      setHours(value)
                    }}
                  />hour
                  <span>:</span>
                  <input
                    type="number"
                    className="timer-input timer-input-mins"
                    min="0"
                    max="59"
                    step="1"
                    value={minutes}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(59, Number(e.target.value)))
                      setMinutes(value)
                    }}
                  />min
                </div>)}
              </div>

              {/* Camera */}
              <label className="toggle-row"><strong>Camera:</strong></label>
              <label className="toggle-row">
                <input type="checkbox" data-proctor="camera-enabled" />
                <span>Show camera</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="camera-face" />
                <span>Face Detection: Detect Face absence</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="camera-eye" />
                <span>Eye-Tracking: Gaze Direction</span>
              </label>

              {/* Microphone */}
              <label className="toggle-row"><strong>Microphone:</strong></label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="microphone-enabled" />
                <span>Show microphone</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="noise-loud" />
                <span>Noise-detection: Detect loud background noise</span>
              </label>

              {/* Screen */}
              <label className="toggle-row"><strong>Screen:</strong></label>
              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-tab"/>
                <span>Detect tab switching or minimize</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-fullscreen"/>
                <span>Detect fullscreen exit</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-devtools"/>
                <span>Detect DevTools Opening</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-leave"/>
                <span>Detect leaving fullscreen</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-keyshortcuts"/>
                <span>Block Keyboard Shortcuts</span>
              </label>

              <label className="toggle-row">
                <input type="checkbox" data-proctor="screen-secondmonitor"/>
                <span>Fake "Second Monitor Detection"</span>
              </label>

            </div>)}

          </div>
        
          <div className="proctor-footer">
            <button className="btn-save" onClick={saveProctorSettings} disabled>💾 Save</button>
          </div>
        </div>
      </div>

      {/*<TitleCard />*/}
      {/* <ExamCard /> */}
    </div>
  )
}
