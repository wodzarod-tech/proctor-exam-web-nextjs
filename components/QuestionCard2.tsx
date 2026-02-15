"use client"

import { useState } from "react"

type Option = {
  id: string
  text: string
  checked: boolean
}

type QuestionType = "radio" | "checkbox"

export type Question = {
  id: string
  text: string
  type: QuestionType
  points: number
  required: boolean
  options: Option[]
  feedbackOk: string
  feedbackError: string
}

type Props = {
  question: Question
  index: number
  total: number
  updateQuestion: (id: string, patch: Partial<Question>) => void
  removeQuestion: (id: string) => void
}

export default function QuestionCard2({
  question,
  index,
  total,
  updateQuestion,
  removeQuestion
}: Props) {

  function addOption() {
    updateQuestion(question.id, {
      options: [
        ...question.options,
        {
          id: crypto.randomUUID(),
          text: "",
          checked: false
        }
      ]
    })
  }

  function removeOption(optionId: string) {
    if (question.options.length <= 1) return

    updateQuestion(question.id, {
      options: question.options.filter(o => o.id !== optionId)
    })
  }

  function toggleOption(optionId: string) {
    updateQuestion(question.id, {
      options: question.options.map(o =>
        question.type === "radio"
          ? { ...o, checked: o.id === optionId }
          : o.id === optionId
          ? { ...o, checked: !o.checked }
          : o
      )
    })
  }

  return (
    <div className="card question">

      <div className="drag">: : :</div>

      <div className="question-header">

        <div className="q-counter" style={{
          fontSize: "13px",
          color: "#5f6368",
          marginRight: "auto"
        }}>
          {index + 1} de {total}
        </div>

        <button
          className="btn-link g-tooltip delete-top"
          onClick={() => removeQuestion(question.id)}>
          <i className="fa fa-trash"></i>
        </button>

        <div className="q-points">
          <input
            type="number"
            className="points-input"
            min="0"
            step="0.1"
            placeholder="0"
            value={question.points}
            onChange={(e) =>
              updateQuestion(question.id, {
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
        value={question.text}
        onChange={(e) =>
          updateQuestion(question.id, {
            text: e.target.value
          })
        }
      />

      <select
        value={question.type}
        onChange={(e) =>
          updateQuestion(question.id, {
            type: e.target.value as QuestionType,
            options: question.options.map(o => ({
              ...o,
              checked: false
            }))
          })
        }
      >
        <option value="radio">◉ One choice</option>
        <option value="checkbox">☑ Multiple choices</option>
      </select>

      <div className="options">
        {question.options.map(opt => (
          <div key={opt.id} className="option-row">
            <input
              type={question.type}
              checked={opt.checked}
              onChange={() => toggleOption(opt.id)}
            />

            <textarea
              value={opt.text}
              placeholder="Option"
              onChange={(e) =>
                updateQuestion(question.id, {
                  options: question.options.map(o =>
                    o.id === opt.id
                      ? { ...o, text: e.target.value }
                      : o
                  )
                })
              }
            />

            <button onClick={() => removeOption(opt.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="btn-link" onClick={addOption}>
        Add option
      </button>

      <div className="feedback">
        <div>
          <strong>Correct:</strong>
          <textarea
            value={question.feedbackOk}
            placeholder="Feedback"
            onChange={(e) =>
              updateQuestion(question.id, {
                feedbackOk: e.target.value
              })
            }
          />
        </div>

        <div>
          <strong>Incorrect:</strong>
          <textarea
            value={question.feedbackError}
            placeholder="Feedback"
            onChange={(e) =>
              updateQuestion(question.id, {
                feedbackError: e.target.value
              })
            }
          />
        </div>
      </div>

      <div className="actions">
        <label>
          Required
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) =>
              updateQuestion(question.id, {
                required: e.target.checked
              })
            }
          />
        </label>
      </div>

    </div>
  )
}