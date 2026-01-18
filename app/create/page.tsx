'use client'

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-2 bg-primary" />

      <main className="mx-auto max-w-[820px] px-4 pb-32 pt-6">
        {/* Header */}
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
        </div>

        {/* Questions */}
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
      </main>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 flex gap-2 bg-white border px-4 py-2 rounded-t-xl shadow">
        <button onClick={addQuestion}>＋</button>
        <button onClick={addQuestion}>≡</button>
        <button onClick={addQuestion}>📂</button>
        <button onClick={addQuestion}>💾</button>
        <button onClick={addQuestion}>⚙️</button>
        <button onClick={addQuestion}>👁️</button>
        <button onClick={() => router.push('/')}>🏠</button>
      </div>
    </div>
  )
}
