"use client"

import styles from "./SettingsModal.module.css";
import { useEffect } from "react";

interface SettingsModalProps {
  open: boolean
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
  onClose: () => void
}

const SettingsModal = ({
  open,
  settings,
  setSettings,
  onClose
}: SettingsModalProps) => {

  // Handle Body Scroll Lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to restore scroll if component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null

  return (
    <div className={styles.settingsModal}>
    
    <div className={styles.settingsCard}>

        <div className={styles.settingsHeader}>
            <span>Settings</span>
            <button className={`${styles.settingsBack} ${styles.gTooltip}`} 
                data-tooltip="Continue"
                onClick={onClose}>
                <span className={styles.backArrow}>→ </span>
            </button>
        </div>
        
        <div className={styles.settingsContent}>

        {/* Shuffle questions */}
        <div className={styles.gfToggleRow}>
        <span className={styles.gfLabel}>Shuffle questions</span>

        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.general.shuffleQuestions}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Shuffle options */}
        <div className={styles.gfToggleRow}>
        <span className={styles.gfLabel}>
            Shuffle options
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.general.shuffleOptions}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* View toggle One by One/All questions */}
        <div className={styles.gfToggleRow}>
        <span className={styles.gfLabel}>
            View toggle "All / One by One" questions
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.general.viewToggleQuestions}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* View questions One by One */}
        <div className={styles.gfToggleRow}>
        <span className={styles.gfLabel}>
            View questions One by One
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.general.viewQuestions}
            onChange={(e) =>
                setSettings((prev:any) => ({
                ...prev,
                general: {
                    ...prev.general,
                    viewQuestions: e.target.checked
                }
                }))
            }
            />
            <span className={styles.slider}></span>
        </label>
        </div>

        {/* Points minimum to pass */}
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
            onKeyDown={(e) => {
                const invalidKeys = [, ",", "-", "e", "E", "+"];

                if (invalidKeys.includes(e.key)) {
                    e.preventDefault();
                    return;
                }

                const input = e.currentTarget;
                const value = input.value;

                // Allow control keys (backspace, arrows, tab, etc.)
                if (
                    e.key === "Backspace" ||
                    e.key === "Delete" ||
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowRight" ||
                    e.key === "Tab"
                ) {
                    return;
                }

                // Allow only one decimal point
                if (e.key === ".") {
                if (value.includes(".")) {
                    e.preventDefault();
                }
                return;
                }

                // If already has decimal, limit to 2 decimal places
                if (value.includes(".")) {
                const decimals = value.split(".")[1];
                if (decimals.length >= 2) {
                    e.preventDefault();
                }
                }

                // Prevent typing more than 2 digits
                if (input.value.length >= 4) {
                    e.preventDefault();
                }
            }}
            onPaste={(e) => {
                const paste = e.clipboardData.getData("text");

                // Allow numbers with up to 2 decimals
                if (!/^\d+(\.\d{0,2})?$/.test(paste)) {
                    e.preventDefault();
                }
            }}
            onChange={(e) => {
                let value = e.target.value;

                // Extra safety validation
                if (!/^\d*(\.\d{0,2})?$/.test(value)) return;

                setSettings((prev:any) => ({
                ...prev,
                general: {
                    ...prev.general,
                    scoreMin: Number(value) || 0
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

        {/* Time Left */}
        <div className={styles.gfToggleRow}>
            <span className={styles.gfLabel}>
                Time Left
            </span>

            <div className={styles.qPoints}>
                <input
                type="number"
                className={styles.pointsInput}
                min="0"
                max="24"
                step="1"
                value={settings.timer.hours}
                onKeyDown={(e) => {
                    const invalidKeys = [".", ",", "-", "e", "E", "+"];

                    if (invalidKeys.includes(e.key)) {
                        e.preventDefault();
                        return;
                    }

                    const input = e.currentTarget;
                    
                    // Allow control keys (backspace, arrows, tab, etc.)
                    if (
                        e.key === "Backspace" ||
                        e.key === "Delete" ||
                        e.key === "ArrowLeft" ||
                        e.key === "ArrowRight" ||
                        e.key === "Tab"
                    ) {
                        return;
                    }

                    // Prevent typing more than 2 digits
                    if (input.value.length >= 2) {
                        e.preventDefault();
                    }
                }}
                onPaste={(e) => {
                    const paste = e.clipboardData.getData("text");

                    // Only allow up to 2 digits
                    if (!/^\d{1,2}$/.test(paste)) {
                    e.preventDefault();
                    }
                }}
                onChange={(e) => {
                    let value = e.target.value;

                    if (value === "") {
                        setSettings((prev: any) => ({
                            ...prev,
                            timer: { ...prev.timer, hours: "" }
                        }));
                        return;
                    }

                    let num = Math.min(24, Number(value));

                    setSettings((prev:any) => ({
                    ...prev,
                    timer: {
                        ...prev.timer,
                        hours: num
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
                onKeyDown={(e) => {
                    const invalidKeys = [".", ",", "-", "e", "E", "+"];

                    if (invalidKeys.includes(e.key)) {
                        e.preventDefault();
                        return;
                    }

                    const input = e.currentTarget;
                    
                    // Allow control keys (backspace, arrows, tab, etc.)
                    if (
                        e.key === "Backspace" ||
                        e.key === "Delete" ||
                        e.key === "ArrowLeft" ||
                        e.key === "ArrowRight" ||
                        e.key === "Tab"
                    ) {
                        return;
                    }

                    // Prevent typing more than 2 digits
                    if (input.value.length >= 2) {
                        e.preventDefault();
                    }
                }}
                onPaste={(e) => {
                    const paste = e.clipboardData.getData("text");

                    // Only allow up to 2 digits
                    if (!/^\d{1,2}$/.test(paste)) {
                    e.preventDefault();
                    }
                }}
                onChange={(e) => {
                    let value = e.target.value;

                    if (value === "") {
                        setSettings((prev: any) => ({
                            ...prev,
                            timer: { ...prev.timer, minutes: "" }
                        }));
                        return;
                    }

                    let num = Math.min(59, Number(value));

                    setSettings((prev:any) => ({
                    ...prev,
                    timer: {
                        ...prev.timer,
                        minutes: num
                    }
                    }))
                }}
                />min
            </div>
        </div>

        {/* Camera */}
        <div className={styles.gfToggleRow}>
            <span className={styles.gfLabel}>
                Camera:{" "}
                <span className={styles.noRecordingWrapper}>
                <span className={styles.noRecording}>(no recording)</span>
                <span className={styles.tooltip}>
                    Your camera is used only for live proctoring.
                    No video is recorded, stored, or transmitted.
                </span>
                </span>
            </span>

            <label className={styles.switch}>
            <input
                type="checkbox"
                checked={settings.camera.enabled}
                onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* show only if camera enabled */}
        {settings.camera.enabled && (
        <>
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Detect Face absence
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.camera.faceAbsence}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Eye-Tracking: Gaze Direction */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Eye-Tracking: Gaze Direction
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.camera.eyeTracking}
            onChange={(e) =>
            setSettings((prev:any) => ({
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
        </>
        )}
        
        {/* Microphone */}
        <div className={styles.gfToggleRow}>
        <span className={styles.gfLabel}>
            Microphone: Noise-detection{" "}
            <span className={styles.noRecordingWrapper}>
            <span className={styles.noRecording}>(no recording)</span>
                <span className={styles.tooltip}>
                Your microphone is used only for live proctoring.
                No audio is recorded, stored, or transmitted.
                </span>
            </span>
            </span>

        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.microphone.enabled}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Screen */}
        <div>
        <span className={styles.gfLabel}>
            Screen:
        </span>
        </div>

        {/* Detect tab switching or minimize */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Detect tab switching or minimize
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.tabSwitch}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Detect fullscreen exit */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Detect fullscreen exit
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.fullscreenExit}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Detect DevTools Opening */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Detect DevTools Opening
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.devToolsOpen}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Detect leaving fullscreen */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Detect leaving fullscreen
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.leaveFullScreen}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Block Keyboard Shortcuts */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Block Keyboard Shortcuts
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.blockKeyShortcuts}
            onChange={(e) =>
                setSettings((prev:any) => ({
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

        {/* Second Monitor Detection */}
        <div className={`${styles.gfToggleRow} ${styles.subSetting}`}>
        <span className={styles.gfLabel}>
            Second Monitor Detection
        </span>
        <label className={styles.switch}>
            <input
            type="checkbox"
            checked={settings.screen.secondMonitor}
            onChange={(e) =>
                setSettings((prev:any) => ({
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
  )  
}

export default SettingsModal