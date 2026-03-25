"use client"

import { useRef, useState } from "react"
import styles from "./ImageUploadModal.module.css"

interface ImageUploadModalProps {
  open: boolean
  onClose: () => void
  onSelect: (file: File) => void
}

export default function ImageUploadModal({
  open,
  onClose,
  onSelect
}: ImageUploadModalProps) {

const inputRef = useRef<HTMLInputElement | null>(null)
const [error, setError] = useState("")

if (!open) return null

function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const file = files[0]

  setError("");

  // file validation
  if (!file.type.startsWith("image/")) {
    setError("Only image files are allowed (JPG, PNG, GIF).");
    return
  }

    // Validate size (1MB = 1024 * 1024 bytes)
  if (file.size > 1024 * 1024) {
    setError("Image must be smaller than 1MB.");
    return;
  }

  onSelect(file)
}

function handleDrop(e: React.DragEvent<HTMLDivElement>) {
  setError("");
  e.preventDefault()
  e.stopPropagation() // prevents modal closing when dropping files.
  handleFiles(e.dataTransfer.files)
}

function handleBrowse() {
  setError("");
  inputRef.current?.click()
}

function handleClose() {
  setError("");
  onClose();
}

return (
<div className={styles.overlay} onClick={handleClose}>
    <div
    className={styles.modal}
    onClick={(e) => e.stopPropagation()}
    >
    <h3>Insert image</h3>

    <div
        className={styles.dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
    >
        <i className="fa-solid fa-image"></i>

        <p>Drag & drop an image here</p>
        <small className={styles.hint}>
          Max size: 10KB • Formats: JPG, PNG, GIF
        </small>

        {error && <p className={styles.error}>{error}</p>}

        <br></br>
        <button
        type="button"
        onClick={handleBrowse}
        className={styles.browseBtn}
        >
        Browse file
        </button>

        <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        />
    </div>

    <button
        className={styles.closeBtn}
        onClick={handleClose}
    >
        Cancel
    </button>
    </div>
</div>
)
}