"use client";

import styles from "./ExamComponent.module.css";
import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { createExam, updateExam } from "@/lib/actions/exam.actions"

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

/***************************
Helpers
***************************/

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

let uuid = "";

/***************************
Page
***************************/
const ExamComponent = ({ id, exam, userId }: ExamSessionProps) => {
  console.log('ExamComponent.id=', id);
  console.log('ExamComponent.exam=', exam);

  const router = useRouter()

  let formattedQuestions=null;

  // To edit exam
  if(exam != null) {
    // Transform Supabase Questions
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
      })),
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

  const totalPoints = questions?.reduce((sum, q) => sum + (q.points ?? 0), 0) ?? 0;
  const formattedPoints = Number(totalPoints);

  // Face absence detection and eye-tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

//  const modelRef = useRef<any>(null);
//  const detectLoopRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFaceStateRef = useRef<string>("unknown");

/***************************
Effects
***************************/
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
/*
  // Auto-save JSON
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('formContent', JSON.stringify(exportJSON(), null, 2))
    }, 1500)

    return () => clearTimeout(timeout)
  }, [title, description, questions, settings])
*/

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

  // auto-adjust textarea when loading existing content
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto"
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
  }

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

/***************************
Actions
***************************/
  function prevQuestion() {

  }

  function nextQuestion() {
    
  }

  function submitExam() {
    let score = 0;

    const reviewData = questions.map((q) => {
      const correctIds = q.options
        .filter((o) => o.checked)
        .map((o) => o.id);

      const userAnswers = answers[q.id] || [];

      const isCorrect =
        correctIds.length === userAnswers.length &&
        correctIds.every((id) => userAnswers.includes(id));

      if (isCorrect) score += q.points;

      return {
        ...q,
        correctIds,
        userAnswers,
      };
    });

    const total = questions.reduce((sum, q) => sum + q.points, 0);

    // Store for review page
    sessionStorage.setItem("examReview", JSON.stringify(reviewData));
    sessionStorage.setItem("examScore", String(score));
    sessionStorage.setItem("examTotal", String(total));

    router.push("/result");
  }

  function filterResults(qid: string) {
  }

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
            checked: o.checked
          })),
          feedbackOk: q.feedbackOk,
          feedbackError: q.feedbackError
        })),
        settings
      }
      
      // Dont save or preview if no title
      if(examPayload.title == "") {
        alert("Add title ⚠️");
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
          alert("Saved successfully ✅")

        return true;
      }

    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to save exam")
      return false;
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

        <div className="flex items-center gap-8">
        
        {/* NavItems */}
        <nav className={styles.toolbarNav}>
          <button className={styles.gTooltip} data-tooltip="Add question" onClick={addQuestion}><i className="fa fa-plus"></i></button>
          <button className={styles.gTooltip} data-tooltip="Import Exam"><i className="fa fa-upload"></i></button>
          <button className={styles.gTooltip} data-tooltip="Save Exam" onClick={() => saveExam(false)}><i className="fa fa-save"></i></button>
          <button className={styles.gTooltip} data-tooltip="Settings" onClick={() => setIsSettingsOpen(true)}><i className="fa fa-gear"></i></button>
          <button className={styles.gTooltip} data-tooltip="Preview exam" onClick={previewExam}><i className="fa fa-eye"></i></button>
          <button className={styles.gTooltip} data-tooltip="Delete exam"><i className="fa fa-trash"></i></button>
          <button className={`${styles.toolbarBtn} ${styles.primary}`}>Publish</button>
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

              <div
                ref={(el) => {
                  optionRefs.current[q.id] = el
                }}
              >
                {q.options.map((opt, index) => (
                  <div key={opt.id} className={styles.option}>

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

                    <button
                      className={styles.btnLink}
                      onClick={() => removeOption(q.id, opt.id)}
                    >
                      ✕
                    </button>

                  </div>
                ))}
              </div>

              <div>
                <button className={styles.btnLink} onClick={() => addOption(q.id)}>Add option</button>
              </div>
    
              <div className={styles.lineSeparator} />
  
              <div className={styles.feedbackOkLabel}>
                <span className={styles.feedbackIcon}>✔</span>
                <span>Feedback Correct:</span>
              </div>

              <textarea
                className={styles.textUnderlineInput}
                rows={1}
                placeholder="Feedback"
                value={q.feedbackOk}
                onChange={(e) => {
                  updateQuestion(q.id, { feedbackOk: e.target.value })
                  autoResize(e)
                }}
              />

              <div className={styles.feedbackErrorLabel}>
                <span className={styles.feedbackIcon}>✖</span>
                <span>Feedback Incorrect:</span>
              </div>

              <textarea
                className={styles.textUnderlineInput}
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
      <div className={`${styles.settingsModal} ${!isSettingsOpen ? styles.hidden : ""}`}>
        
        <div className={styles.settingsCard}>

          <div className={styles.settingsHeader}>
            <h3>Settings</h3>
            <button className={styles.btnIcon} onClick={() => setIsSettingsOpen(false)}>✕</button>
          </div>
          
          <div className={styles.settingsContent}>

              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Shuffle questions
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Shuffle options
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  View toggle One by One/All questions
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  View questions One by One
                </span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    data-proctor="view-questions"
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Points minimum to pass
                </span>

                <div className={styles.qPoints}>
                  <input
                    type="number"
                    className={styles.pointsInput}
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
            
              <div className={styles.lineSeparator} />

              <div>
                <span className={styles.gfLabel}>
                  <h2><strong>PROCTOR</strong></h2>
                </span>
              </div>

              {/* Timer */}
              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Timer Left
                </span>

                <div className={styles.qPoints}>
                  <input
                    type="number"
                    className={styles.pointsInput}
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
                    className={styles.pointsInput}
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
              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Camera
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Detect Face absence
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Eye-Tracking: Gaze Direction
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              {/* Microphone */}
              <div className={styles.gfToggleRow}>
                <span className={styles.gfLabel}>
                  Microphone
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Noise-detection: Detect loud background noise
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              {/* Screen */}
              <div>
                <span className={styles.gfLabel}>
                  Screen
                </span>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Detect tab switching or minimize
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Detect fullscreen exit
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Detect DevTools Opening
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Detect leaving fullscreen
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Block Keyboard Shortcuts
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
                <span className={styles.gfLabel}>
                  Fake "Second Monitor Detection"
                </span>
                <label className={styles.switch}>
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
                  <span className={styles.slider}></span>
                </label>
              </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
export default ExamComponent