"use client";

import styles from "./ExamComponent.module.css";
import React, { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { createExam, updateExam } from "@/lib/actions/exam.actions"
import { createEmptyQuestion, uid } from "@/lib/utils";
import ImageUploadModal from "./ImageUploadModal/ImageUploadModal";
import { useDeleteExam } from "@/hooks/useDeleteExam"
import DeleteExamModal from "@/components/DeleteExamModal/DeleteExamModal"
import SettingsModal from "@/components/SettingsModal/SettingsModal"

/***************************
Types
***************************/
interface ExamSessionProps {
  id: any;
  exam: any;
  userId: string;
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
  image?: string
}

type Option = {
  id: string
  text: string
  checked: boolean
  image?: string
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

/***************************
Page
***************************/
let uuid = "";

const ExamComponent = ({ id, exam, userId }: ExamSessionProps) => {
  const router = useRouter()
  
  let formattedQuestions = null;

  // To edit exam
  if(exam != null) {
    // transform supabase questions
    const generateId = () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);

    formattedQuestions = exam.questions.map((q: any) => ({
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
        image: opt.image || ""
      })),
      image: q.image || "",
    }));
  }
  //
  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card
  const questionsRef = useRef<HTMLDivElement>(null) // for drag & drop
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({}) // for drag & drop

  // Form fields
  const [title, setTitle] = useState(exam?.title ?? '');
  const [description, setDescription] = useState(exam?.description ?? '');
  const [questions, setQuestions] = useState<Question[]>(() =>
    formattedQuestions ?? [createEmptyQuestion()]
  );

  // Upload image
  const [imageModal, setImageModal] = useState<{
    open: boolean
    qid?: string // for question
    oid?: string // for option
  }>({ open: false })

  // If creating new exam → uses default settings
  const defaultSettings: Settings = {
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
    },
    screen: {
      tabSwitch: false,
      fullscreenExit: false,
      devToolsOpen: false,
      leaveFullScreen: false,
      blockKeyShortcuts: false,
      secondMonitor: false,
    },
  }

  // If editing an exam → loads saved settings
  const [settings, setSettings] = useState<Settings>(
    exam?.settings ?? defaultSettings
  )

  // Open/Close Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Active/Desactivate question card
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const totalPoints = questions?.reduce((sum, q) => sum + (q.points ?? 0), 0) ?? 0;
  const formattedPoints = Number(totalPoints);

/***************************
Effects
***************************/
  // drag & drop a question card
  useEffect(() => {
    if (!questionsRef.current) return

    const sortable = new Sortable(questionsRef.current, {
      handle: `.${styles.drag}`,
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
        handle: `.${styles.optDrag}`,
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
      if (!target.closest(`.${styles.card}.${styles.question}`)) {
        setActiveQuestionId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Resize after loading data
  useEffect(() => {
    const textareas = document.querySelectorAll("textarea")

    textareas.forEach((el) => {
      const ta = el as HTMLTextAreaElement
      ta.style.height = "auto"
      ta.style.height = ta.scrollHeight + "px"
    })
  }, [questions, description])

  // auto-adjust textarea when loading existing content
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto"
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
  }

/***************************
Actions
***************************/
  let saveExamDB;
  async function saveExam(flag: boolean = false): Promise<boolean> {
    
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
            checked: o.checked,
            image: o.image || ""
          })),
          feedbackOk: q.feedbackOk,
          feedbackError: q.feedbackError,
          image: q.image || "",
        })),
        settings
      }
      
      // Dont save or preview if no title
      if(examPayload.title == "") {
        setMsg("⚠️ Add title");
        return false;
      }
      else {
        if(id == null && uuid == "") {
          saveExamDB = await createExam(examPayload);
          uuid = saveExamDB.id;
          console.log("create exam.uuid=", uuid);
        } else {
          if(id!=null)
            uuid = id;
          saveExamDB = await updateExam(uuid, examPayload);
          console.log("update exam.uuid=", uuid);
        }

        if(!flag)
          setMsg("Saved successfully ✓")

        return true;
      }

    } catch (error: any) {
      console.error(error)
      setMsg(error.message || "❌ Failed to save exam")
      return false;
    }
  }

  async function getUrl() {
    // Make sure exam is saved first
    const success = await saveExam(true);

    if (!success) return;

    const fullUrl = `${window.location.origin}/exam/${uuid}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setMsg("🔗 URL copied to clipboard");
    } catch (err) {
      setMsg("❌ Failed to copy URL");
    }
  }

  async function previewExam() {
    const success = await saveExam(true);

    if(success)
      router.push(`/preview/${uuid}`);
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
        options: [{ id: uid(), text: '', checked: false, image: "" }],
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
              checked: false,
              image: ""
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

  // to add image (base64) in question
  function handleQuestionImageUpload(qid: string, file: File) {
    // limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Image must be under 2MB")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setQuestions(prev =>
        prev.map(q =>
          q.id === qid
            ? { ...q, image: reader.result as string }
            : q
        )
      )
    }

    reader.readAsDataURL(file)
  }

  // to add image (base64) in option
  function handleOptionImageUpload(qid: string, oid: string, file: File) {
    // limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Image must be under 2MB")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setQuestions(prev =>
        prev.map(q =>
          q.id === qid
            ? {
                ...q,
                options: q.options.map(o =>
                  o.id === oid ? { ...o, image: reader.result as string } : o
                )
              }
            : q
        )
      )
    }

    reader.readAsDataURL(file)
  }

  // Show message
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!msg) return

    const timer = setTimeout(() => {
      setMsg("")
    }, 3000)

    return () => clearTimeout(timer)
  }, [msg])

  // Delete exam
  const { isDeleteOpen, setIsDeleteOpen, deleting, handleDelete } = useDeleteExam()

/***************************
Render
***************************/
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

        <div className="flex-1 text-center text-blue-600">{msg}</div>

        <div className="flex items-center gap-8">
        
        {/* NavItems */}
        <nav className={styles.toolbarNav}>
          <button className={styles.gTooltip} data-tooltip="Add question" onClick={addQuestion}><i className="fa fa-plus"></i></button>
          <button className={styles.gTooltip} data-tooltip="Settings" onClick={() => setIsSettingsOpen(true)}><i className="fa fa-gear"></i></button>
          {/*<button className={styles.gTooltip} data-tooltip="Import Exam"><i className="fa fa-upload"></i></button>*/}
          <button className={styles.gTooltip} data-tooltip="Save Exam" onClick={() => saveExam(false)}><i className="fa fa-save"></i></button>
          <button className={styles.gTooltip} data-tooltip="Get URL to Take exam" onClick={getUrl}><i className="fa fa-link"></i></button>
          <button className={styles.gTooltip} data-tooltip="Preview exam" onClick={previewExam}><i className="fa fa-eye"></i></button>
          <button className={styles.gTooltip} data-tooltip="Delete exam" onClick={() => setIsDeleteOpen(true)}><i className="fa fa-trash"></i></button>
          {/*<button className={`${styles.toolbarBtn} ${styles.primary}`}>Publish</button>*/}
        </nav>

        {/*<SignedOut>
            <SignInButton>
            <button className="btn-signin">Sign In</button>
            </SignInButton>
        </SignedOut>

        <SignedIn>
            <UserButton />
        </SignedIn>*/}
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
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className={`${styles.textUnderlineInput} ${styles.formDescription}`}
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
            <div key={q.id} className={`${styles.card} ${styles.question} ${activeQuestionId === q.id ? styles.active : ""}`}

              onClick={() => setActiveQuestionId(q.id)}>

              <div className={styles.drag}>: : :</div>

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
                onChange={(e) => {
                  updateQuestion(q.id, { text: e.target.value })
                  autoResize(e)
                }}
              />

              {/* upload image */}
              <label className={`${styles.btnLink} ${styles.gTooltip}`}
                data-tooltip="Add image"
                onClick={() =>
                  setImageModal({ open: true, qid: q.id })
                }
                >
                <i className="fa-solid fa-image"></i>
              </label>
              
              {/* image preview */}
              {q.image && (
                <div className={styles.questionImageWrapper}>
                  <Image
                    src={q.image}
                    alt="Question image"
                    width={500}
                    height={300}
                    style={{ maxWidth: "100%" }}
                    className={styles.questionImage}
                  />

                  {activeQuestionId === q.id && (
                  <button
                    className={`${styles.removeImageX} ${styles.gTooltip}`}
                    data-tooltip="Remove image"
                    onClick={() => updateQuestion(q.id, { image: "" })}
                  >
                    ✕
                  </button>
                  )}
                </div>
              )}              

              {/* Select option type */}
              <div>
                <select className={styles.qType}
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
              </div>

              {/* Options */}  
              <div
                ref={(el) => {
                  optionRefs.current[q.id] = el
                }}
              >
                {q.options.map((opt, index) => (
                  <React.Fragment key={opt.id}>
                  <div className={styles.option}>

                    <div className={styles.optDrag}>⋮⋮</div>

                    <input
                      className={styles.optIcon}
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
                      className={styles.textUnderlineInput}
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

                    {/* upload image */}
                    <label className={`${styles.btnLink} ${styles.gTooltip}`}
                      data-tooltip="Add image"
                      onClick={() =>
                        setImageModal({
                          open: true,
                          qid: q.id,
                          oid: opt.id
                        })
                      }>
                      <i className="fa-solid fa-image"></i>
                    </label>
                    
                    <button
                      className={styles.btnLink}
                      onClick={() => removeOption(q.id, opt.id)}
                    >
                      ✕
                    </button>

                  </div>

                  {/* image preview */}
                  {opt.image && (
                    <div className={styles.questionImageWrapper}>
                      <Image
                        src={opt.image}
                        alt="Option image"
                        width={150}
                        height={100}
                        style={{ maxWidth: "100%" }}
                      />

                      {activeQuestionId === q.id && (
                      <button
                        className={`${styles.removeImageX} ${styles.gTooltip}`}
                        data-tooltip="Remove image"
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: q.options.map(o =>
                              o.id === opt.id ? { ...o, image: "" } : o
                            )
                          })
                        }
                      >
                        ✕
                      </button>
                      )}
                    </div>
                  )} 
                  </React.Fragment>
                ))}
              </div>

              <div>
                <button className={styles.btnLink} onClick={() => addOption(q.id)}>Add option</button>
              </div>
    
              <div className={styles.lineSeparator} />
  
              {/* Feedback */}
              <div className={styles.feedbackOkHeader}>
                <span className={styles.feedbackIcon}>✔</span>
                <span>Feedback Correct:</span>
              </div>

              <textarea
                className={`${styles.textUnderlineInput} ${styles.feedback} ${styles.feedbackOkLabel}`}
                rows={1}
                placeholder="Feedback"
                value={q.feedbackOk}
                onChange={(e) => {
                  updateQuestion(q.id, { feedbackOk: e.target.value })
                  autoResize(e)
                }}
              />

              <div className={styles.feedbackErrorHeader}>
                <span className={styles.feedbackIcon}>✖</span>
                <span>Feedback Incorrect:</span>
              </div>

              <textarea
                className={`${styles.textUnderlineInput} ${styles.feedback} ${styles.feedbackErrorLabel}`}
                rows={1}
                placeholder="Feedback"
                value={q.feedbackError}
                onChange={(e) => {
                  updateQuestion(q.id, { feedbackError: e.target.value })
                  autoResize(e)
                }}
              />

              <div className={styles.lineSeparator} />

              <div className={styles.questionFooter}>
                <div className={styles.footerActions}>

                  <div className={styles.tooltipWrapper}>
                    <button
                      className={styles.iconBtn}
                      onClick={() =>
                        setQuestions(prev => prev.filter(x => x.id !== q.id))
                      }
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                    <span className={styles.tooltipText}>Delete question</span>
                  </div>

                  <div className={styles.verticalDivider}></div>

                  <div className={styles.requiredToggle}>
                    <span className={styles.gfLabel}>Required</span>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={q.required}
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
          ))}
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>

    {/* Delete Modal */}
    <DeleteExamModal
      open={isDeleteOpen}
      deleting={deleting}
      onCancel={() => setIsDeleteOpen(false)}
      onConfirm={async () => {
        await handleDelete(id)
        setIsDeleteOpen(false)
      }}
    />

    {/* Image modal */}
    <ImageUploadModal
      open={imageModal.open}
      onClose={() => setImageModal({ open: false })}
      onSelect={(file) => {
        if (imageModal.qid && imageModal.oid) {
          handleOptionImageUpload(imageModal.qid, imageModal.oid, file)
        } else if (imageModal.qid) {
          handleQuestionImageUpload(imageModal.qid, file)
        }

        // close modal after selecting
        setImageModal({ open: false })
      }}
    />
    </>
  )
}
export default ExamComponent