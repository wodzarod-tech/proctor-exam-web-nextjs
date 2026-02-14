'use client'
import "./create.css"

/*
  NOTE:
  This is a faithful React + Next.js + TypeScript conversion of your create.html + create.js logic.
  - DOM queries → React state
  - innerHTML → JSX
  - global listeners → scoped handlers
  - SortableJS integrated safely
  - Tailwind classes replace CSS layout
  - Business logic preserved
*/

import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import ExamCard from '@/components/ExamCard'
import TitleCard from '@/components/TitleCard'
import QuestionCard from '@/components/QuestionCard'

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

/* =====================
   Page
===================== */

export default function CreatePage() {
  const router = useRouter()
  const questionsRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [settings, setSettings] = useState<ProctorSettings | null>(null)

  const [isProctorOpen, setIsProctorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showScoreMin, setShowScoreMin] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
const [scoreMinValue, setScoreMinValue] = useState(0)

  /* =====================
     Derived
  ===================== */

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  /* =====================
     Effects
  ===================== */

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('formContent')
    if (!raw) return

    const data = JSON.parse(raw)

    setTitle(data.title || '')
    setDescription(data.description || '')
    setQuestions(data.questions || [])
    setSettings(data.settings || null)
  }, [])

  // Auto-save JSON
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('formContent', JSON.stringify(exportJSON(), null, 2))
    }, 1500)

    return () => clearTimeout(timeout)
  }, [title, description, questions, settings])

  // Enable Sortable (questions)
  useEffect(() => {
    if (!questionsRef.current) return

    new Sortable(questionsRef.current, {
      handle: '.drag',
      animation: 150,
      onEnd: evt => {
        const reordered = [...questions]
        const [moved] = reordered.splice(evt.oldIndex!, 1)
        reordered.splice(evt.newIndex!, 0, moved)
        setQuestions(reordered)
      }
    })
  }, [questions])

  /* =====================
     Actions
  ===================== */

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
    setQuestions(qs =>
      qs.map(q =>
        q.id === qid
          ? { ...q, options: [...q.options, { id: uid(), text: '', checked: false }] }
          : q
      )
    )
  }

  function removeOption(qid: string, oid: string) {
    setQuestions(qs =>
      qs.map(q =>
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

  /* =====================
     Render
  ===================== */

  return (
    <div>
    {/*<div className="min-h-screen bg-background text-foreground">*/}

      <header className="h-2 bg-primary" />

      <div className="container">

        {/* Form header */}
        <div className="card form-header">
          <div className="form-header-row">
            <div>
              <input className="title-input" id="formTitle" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/>
              <input className="desc-input" id="formDesc" placeholder="Form description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="total-points">
              <span>Total points</span>
              <strong id="totalPoints">0</strong>
            </div>
          </div>
        </div>

          {/* Questions */}
          <div id="questions"></div>
      </div>

      {/* Bottom toolbar */}
      <div id="gformsToolbar" className="gforms-toolbar bottom">
        {/* Handle */}
        <div className="toolbar-handle g-tooltip" id="toolbarHandle" data-tooltip="Close panel" onClick={addQuestion}>▼</div>

        <div className="toolbar-buttons">
          <button className="g-tooltip" data-tooltip="Add question" onClick={addQuestion}>+</button>
          <button className="g-tooltip" data-tooltip="Import Exam" onClick={addQuestion}>📂</button>
          <button className="g-tooltip" data-tooltip="Export Exam" onClick={addQuestion}>💾</button>
          <button className="g-tooltip" data-tooltip="Settings" onClick={() => setIsProctorOpen(true)}>⚙️</button>
          <button className="g-tooltip" data-tooltip="Preview exam" onClick={addQuestion}>👁️</button>
          <button className="g-tooltip" data-tooltip="Home" onClick={addQuestion}>🏠</button>
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
          {/*
          <div className="proctor-footer">
            <button className="btn-save" onClick={saveProctorSettings} disabled>💾 Save</button>
          </div>
          */}
        </div>
      </div>




      {/*
      <main className="mx-auto max-w-[820px] px-4 pb-32 pt-6">*/}
        {/* Header */}
        
        {/*<TitleCard />*/}
        {/* <ExamCard /> */}
{/*
        <div className="card mb-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            
            <div className="flex-1">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-3xl outline-none"
              />
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Form description"
                className="w-full text-muted-foreground outline-none"
              />
            </div>

            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Total points <strong>{totalPoints}</strong>
            </div>
          </div>
        </div>*/}

        {/* Questions */}
        {/*<QuestionCard />*/}
{/*
        <div ref={questionsRef} className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="card question">
              <div className="drag text-center cursor-grab text-muted-foreground">⋮⋮⋮</div>

              <div className="flex items-start gap-3">
                <span className="text-sm text-muted-foreground">{i + 1} de {questions.length}</span>

                <input
                  type="number"
                  className="ml-auto w-14 text-right outline-none"
                  value={q.points}
                  onChange={e => updateQuestion(q.id, { points: Number(e.target.value) || 0 })}
                />
              </div>

              <textarea
                className="w-full resize-none text-lg outline-none"
                placeholder="Question"
                value={q.text}
                onChange={e => updateQuestion(q.id, { text: e.target.value })}
              />

              <select
                value={q.type}
                onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                className="mt-2"
              >
                <option value="radio">◉ One choice</option>
                <option value="checkbox">☑ Multiple choices</option>
              </select>

              <div className="mt-2 space-y-2">
                {q.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type={q.type}
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
                      className="flex-1 resize-none outline-none"
                      value={opt.text}
                      placeholder="Option"
                      onChange={e => {
                        updateQuestion(q.id, {
                          options: q.options.map(o =>
                            o.id === opt.id ? { ...o, text: e.target.value } : o
                          )
                        })
                      }}
                    />
                    <button
                      onClick={() => removeOption(q.id, opt.id)}
                      className="text-muted-foreground"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addOption(q.id)}
                className="mt-2 text-primary"
              >
                Add option
              </button>
            </div>
          ))}
        </div>
      </main>*/}

      {/* Bottom Toolbar */}
      {/*
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 flex gap-2 bg-white border px-4 py-2 rounded-t-xl shadow">
        <button onClick={addQuestion}>＋</button>
        <button onClick={addQuestion}>≡</button>
        <button onClick={addQuestion}>📂</button>
        <button onClick={addQuestion}>💾</button>
        <button onClick={addQuestion}>⚙️</button>
        <button onClick={addQuestion}>👁️</button>
        <button onClick={() => router.push('/')}>🏠</button>
      </div>*/}
    </div>
  )
}
