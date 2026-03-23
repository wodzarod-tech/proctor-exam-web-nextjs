"use client";

import styles from "./ExamPreviewComponent.module.css";
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from "next/image";

/***************************
Types
***************************/
interface ExamPreviewProps {
  id: string;
  exam: any;
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
const ExamSessionComponent = ({ id, exam, userId, readOnly = false }: ExamPreviewProps) => {
  console.log('exam=', exam);

  const router = useRouter()

  let formattedQuestions=null;

  if(exam!=null) {
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
        checked: opt.checked ?? false,
        image: opt.image || ""
      })),
      image: q.image || "",
    }));
  }
  //
  const containerRef = useRef<HTMLDivElement>(null) // when click outside question card
  const questionsRef = useRef<HTMLDivElement>(null) // for drag & drop
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({}) // for drag & drop

  // Camera Settings - Eye Tracking
  const lastDirectionRef = useRef<string>("center");
  const directionStartTimeRef = useRef<number>(0);

  // Form fields
  const [title, setTitle] = useState(exam?.title ?? '');
  const [description, setDescription] = useState(exam?.description ?? '');
  const [questions, setQuestions] = useState<Question[]>(() =>
    formattedQuestions
  );

  // For results
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  // Open/Close Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Active/Desactivate question card
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  // Store invalid questions
  const [invalidQuestions, setInvalidQuestions] = useState<string[]>([]);

  const totalPoints = questions?.reduce((sum, q) => sum + (q.points ?? 0), 0) ?? 0;
  const formattedPoints = Number(totalPoints);

  // message
  const [msg, setMsg] = useState<string>("");
  var fmsg = true; // true = show message on label, false = show message on alert

  //-----------------------
  
  // Settings
  
  // View questions One by One
  const [viewOneByOne, setViewOneByOne] = useState(
    exam?.settings?.general?.viewQuestions ?? false
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  const [settings, setSettings] = useState<Settings>(
    exam?.settings ?? {
      general: {
        shuffleQuestions: false,
        shuffleOptions: false,
        viewToggleQuestions: false,
        viewQuestions: false,
        scoreMin: 0,
      },
      timer: { hours: 0, minutes: 0 },
      camera: { enabled: false, faceAbsence: false, eyeTracking: false },
      microphone: { enabled: false },
      screen: {
        tabSwitch: false,
        fullscreenExit: false,
        devToolsOpen: false,
        leaveFullScreen: false,
        blockKeyShortcuts: false,
        secondMonitor: false,
      },
    }
  )

/***************************
Effects
***************************/
// Apply Question + Option Shuffle
useEffect(() => {
  if (!questions) return

  let updated = [...questions]

  // Shuffle questions
  if (settings.general.shuffleQuestions) {
    updated = [...updated].sort(() => Math.random() - 0.5)
  }

  // Shuffle options
  if (settings.general.shuffleOptions) {
    updated = updated.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }))
  }

  setQuestions(updated)
}, [])

  // Camera
  // ---------------------------
  // Face absence detection and eye-tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const faceMeshRef = useRef<any>(null);
  const lastFaceStateRef = useRef<string>("unknown");

  // Eye tracking
  const lastGazeStateRef = useRef<string>("center"); // Stabilization (Hysteresis + Debounce)
  const smoothOffsetRef = useRef<number>(0); // Smooth Stabilization

  useEffect(() => {
    if (!settings.camera.enabled) return

    startCamera({
      faceAbsence: settings.camera.faceAbsence,
      eyeTracking: settings.camera.eyeTracking,
    })

    // Stop camera on unmount: prevents camera staying active after leaving page
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [settings.camera])

  // Face detection
  async function loadScript(src: string) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

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

      // Face Absence detection
      if (cameraSettings.faceAbsence) {
        if (faces.length === 0) {
          if (lastFaceStateRef.current !== "no_face") {
            addViolation(fmsg,"⚠ No face detected. Stay in view.")
            lastFaceStateRef.current = "no_face"
          }
          return
        }

        if (faces.length > 1) {
          if (lastFaceStateRef.current !== "multi_face") {
            addViolation(fmsg,"⚠ Multiple faces detected.")
            lastFaceStateRef.current = "multi_face"
          }
          return
        }

        lastFaceStateRef.current = "one_face"
      }

      if (faces.length === 0) {
        return; // stop here if no face
      }

      // Draw face box
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

      // Eye tracking
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
      //console.log("BLINK");
    }
  }

  function getGazeDirection(landmarks: any[]) {
    const leftEyeLeft = landmarks[33];
    const leftEyeRight = landmarks[133];
    const leftPupil = landmarks[468];

    const eyeWidth = distance(leftEyeLeft, leftEyeRight);

    // Smooth Stabilization
    const rawOffset = (leftPupil.x - leftEyeLeft.x) / eyeWidth;
      smoothOffsetRef.current = smoothOffsetRef.current * 0.8 + rawOffset * 0.2;
    const offset = smoothOffsetRef.current;

    const offsetMin = 0.32; // antes 0.35
    const offsetMax = 0.57; // antes 0.68
    const now = Date.now();
    let currentDirection = "center";

    console.log("offset=", offset);

    if (offset < offsetMin) currentDirection = "right";
    else if (offset > offsetMax) currentDirection = "left";

    // If direction changed → reset timer
    if (currentDirection !== lastDirectionRef.current) {
      lastDirectionRef.current = currentDirection;
      directionStartTimeRef.current = now;
    }

    // If looking left/right AND stable for 400ms
    if (currentDirection !== "center" &&
      now - directionStartTimeRef.current > 400
    ) {
      addViolation(fmsg,`⚠ Looking ${currentDirection} detected`);
    }
  }

  // Microphone
  // ---------------------------
  useEffect(() => {
    if (!settings.microphone.enabled) return

    startMicrophone()

    return () => {
      // Cleanup mic stream
      micStreamRef.current?.getTracks().forEach(track => track.stop());

      // Cleanup audio context
      audioContextRef.current?.close();

      // Stop animation loop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      // cleanup on unmount
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    }
  }, [settings.microphone])

  // Config
  const NOISE_THRESHOLD = 0.16;   // When “too loud”

  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const lastNoiseTimeRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  // Duration for messages
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        /*
        if (volume > SPEAK_THRESHOLD) {
          addViolation(fmsg,'⚠ Someone is speaking!');
          lastNoiseTimeRef.current = Date.now()
        } else if (volume > NOISE_THRESHOLD) {
          addViolation(fmsg,'⚠ Too loud!');
          lastNoiseTimeRef.current = Date.now()
        }
        */
        if (volume > NOISE_THRESHOLD) {
          addViolation(fmsg,'⚠ Noise detected!');
          lastNoiseTimeRef.current = Date.now()
        } 

        animationRef.current = requestAnimationFrame(update)
      }

      update()

    } catch (e: any) {
      setMsgNav(fmsg,"❌ Microphone error: " + e.message)
    }
  }

  // Timer
  // ---------------------------
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerInitialized, setTimerInitialized] = useState(false);

  const hoursTimer = Math.max(0, Math.floor(timeLeft / 3600));
  const minutesTimer = Math.max(0, Math.floor((timeLeft % 3600) / 60));
  const secondsTimer = Math.max(0, timeLeft % 60);

  const formattedTime = `Time Left: ${hoursTimer}:${
    minutesTimer < 10 ? "0" : ""
  }${minutesTimer}:${secondsTimer < 10 ? "0" : ""}${secondsTimer}`;

  // Set initial time on load
  useEffect(() => {
    const total =
    (settings.timer.hours || 0) * 3600 +
    (settings.timer.minutes || 0) * 60

    setTimeLeft(total);
    setTimerInitialized(true); // mark timer ready
  }, []);

  // Countdown Logic
  useEffect(() => {
    if (timeLeft <= 0) return // Timer Stops at 0

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // resize after loading data
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
        initFaceMesh(cameraSettings)
      }
    } catch(e) {
      setMsgNav(fmsg,'❌ Camera error');
    }
  }

  // Auto-submit when timer hits 0
  const [autoSubmitted, setAutoSubmitted] = useState(false) // prevents multiple submits

  useEffect(() => {
    if (!timerInitialized) return;  // prevent early fire

    if (timeLeft === 0 && !autoSubmitted) {
      setAutoSubmitted(true)
      submitExam(true) // pass flag if you want to indicate auto submit
    }
  }, [timeLeft, autoSubmitted, timerInitialized])

  // Screen
  // ---------------------------
  useEffect(() => {
    const screen = settings.screen;

    if (!screen) return;

    // Screen-switch detection (tab change + blur/focus)
    const handleVisibilityChange = () => {
      if (document.hidden && screen.tabSwitch) {
        addViolation(fmsg,"⚠ Tab switch or minimize detected");
      }
    };

    // Detect leaving fullscreen
    const handleFullscreenChange = () => {
      if (
        screen.fullscreenExit &&
        !document.fullscreenElement
      ) {
        addViolation(fmsg,"⚠ Exited fullscreen");
      }
    };

    // Block Keyboard Shortcuts (as many as possible)
    // Blocks Ctrl+T, W, N, R, F5, F11, Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!screen.blockKeyShortcuts) return;

      const blocked =
        (e.ctrlKey && ["t", "w", "n", "r"].includes(e.key.toLowerCase())) ||
        ["F11", "F5", "Escape"].includes(e.key);

      if (blocked) {
        e.preventDefault();
        addViolation(fmsg,`⚠ Blocked shortcut: ${e.key}`);
      }
    };

    // Detect devtools size change
    const detectDevTools = () => {
      if (!screen.devToolsOpen) return;

      const threshold = 160;
      const devToolsOpen =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (devToolsOpen) {
        addViolation(fmsg,"⚠ DevTools detected");
      }
    };

    // Second Monitor Detection
    const detectSecondMonitor = () => {
      if (!screen.secondMonitor) return;

      if (window.screen.availWidth > window.innerWidth + 100) {
        addViolation(fmsg,"⚠ Second monitor detected");
      }
    };

    // Cannot
    // - Truly block Alt+Tab
    // - Truly block OS-level shortcuts
    // - Truly detect all monitor setups

    // Attach listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    const devToolsInterval = setInterval(detectDevTools, 2000);
    const monitorInterval = setInterval(detectSecondMonitor, 3000);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
      clearInterval(monitorInterval);
    };

  }, [settings.screen]);

/***************************
Actions
***************************/
  // Auto Submit After X Violations
  const violationCountRef = useRef(0);
  const MAX_VIOLATIONS = 10;

  function addViolation(flag: boolean, reason: string) {
    violationCountRef.current++;

    setMsgNav(flag, `Violation: ${reason}`);
    //setMsgNav(flag, `Violation ${violationCountRef.current}: ${reason}`);

    /*console.log("violationCountRef.current = ", violationCountRef.current);
    if (violationCountRef.current >= MAX_VIOLATIONS) {
      submitExam(true);
    }*/
  }

  // Navigation buttons
  function prevQuestion() {
    if (!viewOneByOne) return;

    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : prev
    );
  }

  function nextQuestion() {
    if (!viewOneByOne) return;

    setCurrentIndex((prev) =>
      prev < questions.length - 1 ? prev + 1 : prev
    );
  }

  function submitExam(auto = false) {
    if (auto) {
      alert("⏰ Time is up! Submitting exam automatically.");
    }
    
    // for required questions
    const missingRequired: string[] = [];

    questions.forEach((q) => {
      const selected = answers[q.id] || [];

      if (q.required && selected.length === 0) {
        missingRequired.push(q.id);
      }
    });

    if (missingRequired.length > 0) {
      setInvalidQuestions(missingRequired);
      setMsgNav(fmsg,"Some questions still need attention because they are required");
      return;
    }

    setInvalidQuestions([]); // clear if everything is ok

    //-------------------------

    let score = 0;

    // Get user answers
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
    sessionStorage.setItem("examReview", JSON.stringify(reviewData)); // user answers
    sessionStorage.setItem("examScore", String(score));
    sessionStorage.setItem("examTotal", String(total));
    sessionStorage.setItem("scoreMin", exam.settings.general.scoreMin);

    console.log("ExamSessionComponent.examReview=",JSON.stringify(reviewData));
    console.log("ExamSessionComponent.examScore=",score);
    console.log("ExamSessionComponent.examTotal=",total);
    console.log("ExamSessionComponent.scoreMin=",exam.settings.general.scoreMin);

    router.push("/result");
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }

  function setMsgNav(flag: boolean, message: string) {
    if (!flag) {
      alert(message);
      return;
    }

    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    // If empty message → just clear immediately
    if (!message) {
      setMsg("");
      return;
    }

    // Set message
    setMsg(message);

    // Auto clear after 3 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setMsg("");
      messageTimeoutRef.current = null;
    }, 3000);
  }

/***************************
Render
***************************/

  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <div className="flex-1 text-center font-bold text-red-600">{msg}</div>

        {settings.general.viewToggleQuestions && (
        <div className={styles.viewToggle} style={{ display: "flex" }}>
          <span>View:</span>

          <label className={styles.switch}> 
            <input type="checkbox"
            checked={viewOneByOne}
            onChange={(e) => {
              setViewOneByOne(e.target.checked)
              setCurrentIndex(0) // reset to first question
            }}
            />
            <span className={styles.slider}></span>
          </label>

          <span>All / One by one</span>
        </div>
        )}
    </div>
    </nav>

    {/* Timer */}
    <div className={styles.timer}>{formattedTime}</div>

    {/* Webcam */}
    {settings.camera.enabled && (
    <div className={styles.webcam}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline width={480} height={360}
      ></video>
      <canvas ref={overlayRef} className={styles.overlay} style={{ display: "none" }}></canvas> {/* <!-- face detection */}
    </div>
    )}
  
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
          {(viewOneByOne
              ? [questions[currentIndex]]
              : questions
            ).map((q, index) => {
              const realIndex = viewOneByOne ? currentIndex : index;

              return (
                <div 
                key={q.id}
                className={`
                  ${styles.card} 
                  ${styles.question} 
                  ${activeQuestionId === q.id ? styles.active : ""}
                  ${invalidQuestions.includes(q.id) ? styles.requiredError : ""}
                  `}

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
                    {realIndex + 1} de {questions.length}
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
                  </div>
                )}   
                
                {/* Options */}
                <div
                  ref={(el) => {
                    optionRefs.current[q.id] = el
                  }}
                >
                  {q.options.map((opt, index) => (
                    <React.Fragment key={opt.id}>
                    <div className={styles.option}>

                      <input
                        className={styles.optIcon}
                        type={q.type}
                        name={q.type === 'radio' ? q.id : undefined}
                        checked={answers[q.id]?.includes(opt.id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;

                          setAnswers(prev => {
                            const current = prev[q.id] ?? [];

                            // radio
                            if (q.type === "radio") {
                              return {
                                ...prev,
                                [q.id]: [opt.id]
                              };
                            }

                            // checkbox
                            if (checked) {
                              return {
                                ...prev,
                                [q.id]: [...current, opt.id]
                              };
                            } else {
                              return {
                                ...prev,
                                [q.id]: current.filter(id => id !== opt.id)
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
                      </div>
                    )} 
                    </React.Fragment>
                  ))}
                </div>
        
                {/*<div className={styles.lineSeparator} />*/}

                <div className={styles.questionFooter}>
                  <div className={styles.footerActions}>
                    <div className={styles.requiredToggle}>
                      {q.required && (
                        <span className={`${styles.gfLabel} ${styles.requiredActive}`}>
                          Required
                        </span>
                      )}
                      {/*
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
                      */}
                    </div>

                  </div>
                </div>
              </div>
              )
          })}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.questionNav}>
          <div className={styles.navCenter}>

            {/* Previous */}
            <button className={styles.navBtn}
              onClick={prevQuestion}
              style={{ visibility: viewOneByOne && currentIndex > 0 ? "visible" : "hidden" }}>⬅ Previous</button>

            {/* Next */}
            <button className={styles.navBtn}
              onClick={nextQuestion}
              style={{ visibility: viewOneByOne && currentIndex < questions.length - 1
              ? "visible"
              : "hidden"}}>Next ➡</button>
          </div>

          <button className={styles.submitBtn}
            onClick={() => submitExam(false)}
              style={{
              visibility:
                (!viewOneByOne || currentIndex === questions.length - 1)
                  ? "visible"
                  : "hidden"
            }}>Submit</button>
        </div>
      </div>
    </div>
    </>
  )
}
export default ExamSessionComponent