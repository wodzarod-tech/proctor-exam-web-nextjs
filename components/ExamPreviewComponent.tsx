"use client";

import styles from "./ExamPreviewComponent.module.css";
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from "next/image"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

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

//const uid = () => crypto.randomUUID()
/*
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
})*/

/***************************
Page
***************************/
const ExamPreviewComponent = ({ id, exam, userId, readOnly = false }: ExamPreviewProps) => {
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
    formattedQuestions
  );

  // For results
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  // Open/Close Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Active/Desactivate question card
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

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
      microphone: { enabled: false, loudNoise: false },
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

  // Camera
  // ---------------------------
  // Face absence detection and eye-tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

//  const modelRef = useRef<any>(null);
//  const detectLoopRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFaceStateRef = useRef<string>("unknown");

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

    // Face Absence Detection Loop
    /*
    function startDetectLoop() {
      if (detectLoopRef.current) return;

      detectLoopRef.current = setInterval(detectOnce, 700);

      console.log('Detection started');
    }
    
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

        // Face Absence detection
        if (cameraSettings.faceAbsence) {
          if (faces.length === 0) {
            if (lastFaceStateRef.current !== "no_face") {
              setMsgNav(fmsg, "❌ No face detected. Stay in view.")
              lastFaceStateRef.current = "no_face"
            }
            return
          }

          if (faces.length > 1) {
            if (lastFaceStateRef.current !== "multi_face") {
              setMsgNav(fmsg,"❌ Multiple faces detected.")
              lastFaceStateRef.current = "multi_face"
            }
            return
          }

          lastFaceStateRef.current = "one_face"
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
      const offset = (leftPupil.x - leftEyeLeft.x) / eyeWidth;

      if (offset < 0.35) {
        setMsgNav(fmsg,"Looking right detected");
              console.log("offset=", offset);

      }

      if (offset > 0.68) {
        setMsgNav(fmsg,"Looking left detected");
              console.log("offset=", offset);

      }
    }

  // Microphone
  // ---------------------------
  useEffect(() => {
    if (!settings.microphone.enabled) return

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
  }, [settings.microphone])

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
          setMsgNav(fmsg,'🎤 Someone is speaking!');
          lastNoiseTimeRef.current = Date.now()
        } else if (volume > NOISE_THRESHOLD) {
          console.log("⚠ Too loud!")
          setMsgNav(fmsg,'⚠ Too loud!');
          lastNoiseTimeRef.current = Date.now()
        }

        // Count continuous noise time
        if (Date.now() - lastNoiseTimeRef.current < 1000)
          noiseSecondsRef.current++
        else
          noiseSecondsRef.current = 0

        if (!failedRef.current && noiseSecondsRef.current >= MAX_NOISE_TIME) {
          failedRef.current = true
          setMsgNav(fmsg,"❌ Exam failed: too much noise.")
        }

        animationRef.current = requestAnimationFrame(update)
      }

      update()

    } catch (e: any) {
      console.warn("Microphone error:", e)
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

  // auto-adjust textarea when loading existing content
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto"
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
  }

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

/***************************
Actions
***************************/
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

  function setMsgNav(flag: boolean, msg: string){
    if(flag)
      setMsg(msg);
    else
      alert(msg)
  }

/***************************
Render
***************************/

  return (
    <>
    {/* Navbar */}
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <button className={styles.navBtn} data-tooltip="Back to editor" onClick={() => router.push(`/edit/${id}`)}>⬅ Back</button>

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

            <span>One by one</span>
          </div>
          )}
    </div>
    </nav>

    {/* Webcam */}
    {settings.camera.enabled && (
    <div className={styles.webcam}>
      <div className={styles.timer}>{formattedTime}</div>
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
            onClick={submitExam}
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
export default ExamPreviewComponent