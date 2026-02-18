"use client";

//import "./exam.module.css"

import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import ExamCard from '@/components/ExamCard1'
import TitleCard from '@/components/TitleCard'
import QuestionCard from '@/components/QuestionCard2'

interface ExamSessionProps {
  exam: any;
  userId: string;
}

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

const ExamSession = ({ exam, userId }: ExamSessionProps) => {

  const router = useRouter()

  const { titleBD, descriptionBD, questionsBD, settingsBD } = exam;

// Transform Supabase Questions
const rawQuestions =
  typeof exam.questions === "string"
    ? JSON.parse(exam.questions)
    : exam.questions;

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

const formattedQuestions = rawQuestions.map((q: any) => ({
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
//

  const handleSelect = (
    questionIndex: number,
    optionText: string,
    type: string
  ) => {
    setAnswers((prev) => {
      const current = prev[questionIndex] || [];

      if (type === "radio") {
        return {
          ...prev,
          [questionIndex]: [optionText],
        };
      }

      // checkbox
      if (current.includes(optionText)) {
        return {
          ...prev,
          [questionIndex]: current.filter((o) => o !== optionText),
        };
      } else {
        return {
          ...prev,
          [questionIndex]: [...current, optionText],
        };
      }
    });
  };

  const questionsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card

  {/*enableOptionDrag (Sortable per question) */}
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({})

const [title, setTitle] = useState(titleBD || '');
const [description, setDescription] = useState(descriptionBD || '');
const [questions, setQuestions] = useState(formattedQuestions);

const [settings, setSettings] = useState<ProctorSettings | null>(
  settingsBD || null
);
const [answers, setAnswers] = useState<Record<string, string[]>>({});

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

  // Face absence detection and eye-tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

//  const modelRef = useRef<any>(null);
//  const detectLoopRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFaceStateRef = useRef<string>("unknown");

  /* =====================
     Derived
  ===================== */

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  /* =====================
     Effects
  ===================== */
/*
  // Camera
  useEffect(() => {
    const cameraSettings = {
      faceAbsence: true,
      eyeTracking: true,
    }

    startCamera(cameraSettings)

    // Stop camera on unmount: prevents camera staying active after leaving page
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])

  // Microphone
  useEffect(() => {
    startMicrophone()

    return () => {
      // Cleanup mic stream
      micStreamRef.current?.getTracks().forEach(track => track.stop())

      // Cleanup audio context
      audioContextRef.current?.close()

      // Stop animation loop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
*/
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
/*
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
*/
/*
window.onload = async function() {
  // Apply Settings/Proctor/Camera
  await applySettingsProctorCamera(true);
}*/
/***************************
Proctor Settings
***************************/
// Proctor Camera Settings
/*
async function applySettingsProctorCamera(cameraSettings) {
  if(!cameraSettings) return;
  
  await startCamera(cameraSettings);
}
*/

/***************************
Timer
***************************/
const [timeLeft, setTimeLeft] = useState(0);

const hoursTimer = Math.max(0, Math.floor(timeLeft / 3600));
const minutesTimer = Math.max(0, Math.floor((timeLeft % 3600) / 60));
const secondsTimer = Math.max(0, timeLeft % 60);

const formattedTime = `Time Left: ${hoursTimer}:${
  minutesTimer < 10 ? "0" : ""
}${minutesTimer}:${secondsTimer < 10 ? "0" : ""}${secondsTimer}`;

// Set initial time on load
useEffect(() => {
  if (!settings?.timer?.enabled) return;

  const total =
    (settings.timer.hours || 0) * 3600 +
    (settings.timer.minutes || 0) * 60;

  setTimeLeft(total);
}, [settings]);


// Countdown Logic
useEffect(() => {
  if (timeLeft <= 0) return;

  const interval = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [timeLeft]);

/***************************
Face detection
***************************/
async function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/*
async function loadModelIfNeeded() {
  if (modelRef.current) return;

  console.log('Loading model (may take a few seconds)...');

  // load TF.js
  if (!(window as any).tf) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js"
    );
  }

  if (!(window as any).blazeface) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js"
    );
  }

  // load model
  modelRef.current = await (window as any).blazeface.load();
  console.log('Model loaded');
}
*/
// Face Absence Detection Loop
/*
function startDetectLoop() {
  if (detectLoopRef.current) return;

  detectLoopRef.current = setInterval(detectOnce, 700);

  console.log('Detection started');
}
*/
/*
async function detectOnce() {
  const video = videoRef.current;
  const canvas = overlayRef.current;
  if (!video || !canvas || !modelRef.current) return;
  if (video.readyState < 2) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const predictions = await modelRef.current.estimateFaces(
    video,
    false
  );

  // predictions is array of face objects with topLeft, bottomRight, probability
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let state = "no_face";

  if (!predictions || predictions.length === 0) {
    state = "no_face";
  } else if (predictions.length === 1) {
    state = "one_face";

    // draw box
    const p = predictions[0];
    const [x1, y1] = p.topLeft;
    const [x2, y2] = p.bottomRight;

    // label
    ctx.strokeStyle = "rgba(6,182,212,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  } else {
    state = "multi";
  }

  if (state !== lastFaceStateRef.current) {
    if (state === "no_face") {
      alert("No face detected. Stay in view.");
    }
    if (state === "multi") {
      alert("Multiple faces detected.");
    }

    lastFaceStateRef.current = state;
  }
}
*/

// Eye-Tracking (MediaPipe FaceMesh)
async function initFaceMesh(cameraSettings: any) {
  if (!(window as any).FaceMesh) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
    )
  }

  if (!(window as any).Camera) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
    )
  }

  const video = videoRef.current
  const canvas = overlayRef.current
  if (!video || !canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const faceMesh = new (window as any).FaceMesh({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  })

  faceMesh.setOptions({
    maxNumFaces: 2, // allow multi-face detection
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  faceMesh.onResults((results: any) => {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const faces = results.multiFaceLandmarks || []

    /* =========================
       FACE ABSENCE DETECTION
    ========================== */

    if (cameraSettings.faceAbsence) {
      if (faces.length === 0) {
        if (lastFaceStateRef.current !== "no_face") {
          alert("❌ No face detected. Stay in view.")
          lastFaceStateRef.current = "no_face"
        }
        return
      }

      if (faces.length > 1) {
        if (lastFaceStateRef.current !== "multi_face") {
          alert("❌ Multiple faces detected.")
          lastFaceStateRef.current = "multi_face"
        }
        return
      }

      lastFaceStateRef.current = "one_face"
    }

    /* =========================
       DRAW FACE BOX
    ========================== */

    const landmarks = faces[0]

    const xs = landmarks.map((p: any) => p.x * canvas.width)
    const ys = landmarks.map((p: any) => p.y * canvas.height)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    ctx.strokeStyle = "rgba(6,182,212,0.9)"
    ctx.lineWidth = 3
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)

    /* =========================
       EYE TRACKING
    ========================== */

    if (cameraSettings.eyeTracking) {
      analyzeEyes(landmarks)
      getGazeDirection(landmarks)
    }
  })

  faceMeshRef.current = faceMesh

  const camera = new (window as any).Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video })
    },
    width: 480,
    height: 360,
  })

  camera.start()
}

// Eye Analysis Functions
function distance(a: any, b: any) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function analyzeEyes(landmarks: any[]) {
  const LEFT_TOP = 159;
  const LEFT_BOTTOM = 145;
  const RIGHT_TOP = 386;
  const RIGHT_BOTTOM = 374;

  const left =
    distance(landmarks[LEFT_TOP], landmarks[LEFT_BOTTOM]);
  const right =
    distance(landmarks[RIGHT_TOP], landmarks[RIGHT_BOTTOM]);

  const avg = (left + right) / 2;

  if (avg < 0.01) {
    console.log("BLINK");
  }
}

function getGazeDirection(landmarks: any[]) {
  const leftEyeLeft = landmarks[33];
  const leftEyeRight = landmarks[133];
  const leftPupil = landmarks[468];

  const eyeWidth = distance(leftEyeLeft, leftEyeRight);
  const offset =
    (leftPupil.x - leftEyeLeft.x) / eyeWidth;

  if (offset < 0.32) {
    alert("Looking right detected");
  }

  if (offset > 0.68) {
    alert("Looking left detected");
  }
}

/***************************
Camera
***************************/
/*
let camera = null;
const video = document.getElementById('video');
*/
async function startCamera(cameraSettings?: any) {
  if (!videoRef.current) return

  const faceAbsence = cameraSettings?.faceAbsence ?? false
  const eyeTracking = cameraSettings?.eyeTracking ?? false

  try {
    // Start camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })

    videoRef.current.srcObject = stream;

    await videoRef.current.play();

    if (faceAbsence || eyeTracking) {
      //await loadModelIfNeeded();
      //startDetectLoop();

      //if (eyeTracking) {
        initFaceMesh(cameraSettings)
      //}
    }
  } catch(e) {
    console.warn('Camera error', e);
    alert('❌ Camera error');
  }
}

/***************************
Microphone
***************************/
// Config
const NOISE_THRESHOLD = 0.16;   // When “too loud”
const SPEAK_THRESHOLD = 0.18;   // When voice detected
const MAX_NOISE_TIME = 5;       // Seconds before auto-fail

const audioContextRef = useRef<AudioContext | null>(null)
const micStreamRef = useRef<MediaStream | null>(null)
const noiseSecondsRef = useRef(0)
const lastNoiseTimeRef = useRef(0)
const failedRef = useRef(false)
const animationRef = useRef<number | null>(null)

async function startMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    micStreamRef.current = stream

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048

    const freqAnalyser = audioCtx.createAnalyser()
    freqAnalyser.fftSize = 512

    const mic = audioCtx.createMediaStreamSource(stream)
    mic.connect(analyser)
    mic.connect(freqAnalyser)

    const timeData = new Uint8Array(analyser.fftSize)
    const freqData = new Uint8Array(freqAnalyser.frequencyBinCount)

    function update() {
      analyser.getByteTimeDomainData(timeData)
      freqAnalyser.getByteFrequencyData(freqData)

      // Calculate volume (RMS)
      let sum = 0
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128
        sum += v * v
      }

      const volume = Math.sqrt(sum / timeData.length)

      // Check for noise / speaking
      if (volume > SPEAK_THRESHOLD) {
        console.log("🎤 Someone is speaking!")
        alert('🎤 Someone is speaking!');
        lastNoiseTimeRef.current = Date.now()
      } else if (volume > NOISE_THRESHOLD) {
        console.log("⚠ Too loud!")
        alert('⚠ Too loud!');
        lastNoiseTimeRef.current = Date.now()
      }

      // Count continuous noise time
      if (Date.now() - lastNoiseTimeRef.current < 1000)
        noiseSecondsRef.current++
      else
        noiseSecondsRef.current = 0

      if (!failedRef.current && noiseSecondsRef.current >= MAX_NOISE_TIME) {
        failedRef.current = true
        alert("❌ Exam failed: too much noise.")
      }

      animationRef.current = requestAnimationFrame(update)
    }

    update()

  } catch (e: any) {
    console.warn("Microphone error:", e)
    alert("❌ Microphone error: " + e.message)
  }
}

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
        <div id="timer">{formattedTime}</div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline width={480} height={360}
        ></video>
        <canvas ref={overlayRef} className="overlay"></canvas> {/* <!-- face detection */}
      </div>

      <div className="container" ref={containerRef}>

        {/* Options header */}
        <div className="preview-topbar">
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
              <input className="title-input" id="formTitle" placeholder="Title" value={exam.title} onChange={(e) => setTitle(e.target.value)}/>
              <input className="desc-input" id="formDesc" placeholder="Form description" value={exam.description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="total-points">
              <span>Total points</span>
              <strong id="totalPoints">{totalPoints.toFixed(1)}</strong>
            </div>
          </div>
        </div>

          {/* Questions */}
          <div ref={questionsRef} className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="card question"
              onClick={() => setActiveQuestionId(q.id)}>

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
                    disabled
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
                readOnly
                onChange={(e) =>
                  updateQuestion(q.id, { text: e.target.value })
                }
              />

              <div
                className="options"
                ref={(el) => {
                  optionRefs.current[q.id] = el
                }}
              >
                {q.options.map((opt, index) => (
                  <div key={opt.id} className="option">

<input
  className="opt-icon"
  type={q.type}
  name={q.type === "radio" ? q.id : undefined}
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
                      className="opt-text"
                      rows={1}
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      readOnly
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
                  </div>
                ))}
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
    </div>
  )
}
export default ExamSession