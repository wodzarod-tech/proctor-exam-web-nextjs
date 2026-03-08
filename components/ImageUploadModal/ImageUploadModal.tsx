"use client"

import { useRef } from "react"
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

if (!open) return null

function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const file = files[0]

  // file validation
  if (!file.type.startsWith("image/")) {
    alert("Only images allowed")
    return
  }

  onSelect(file)
}

function handleDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault()
  e.stopPropagation() // prevents modal closing when dropping files.
  handleFiles(e.dataTransfer.files)
}

function handleBrowse() {
  inputRef.current?.click()
}

return (
<div className={styles.overlay} onClick={onClose}>
    <div
    className={styles.modal}
    onClick={(e) => e.stopPropagation()}
    >
    <h3>Upload image</h3>

    <div
        className={styles.dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
    >
        <i className="fa-solid fa-image"></i>

        <p>Drag & drop an image here</p>

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
        onClick={onClose}
    >
        Cancel
    </button>
    </div>
</div>
)
}