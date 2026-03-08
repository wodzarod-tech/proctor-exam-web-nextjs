'use client'

import { useEffect } from "react"
import styles from "./DeleteExamModal.module.css"

interface DeleteExamModalProps {
  open: boolean
  deleting?: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

const DeleteExamModal = ({
  open,
  deleting,
  onCancel,
  onConfirm
}: DeleteExamModalProps) => {

  // closes on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }

    if (open) {
      window.addEventListener("keydown", handleEsc)
    }

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>

      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>

        <h3>Delete exam?</h3>

        <p>
          Are you sure you want to delete this exam?
        </p>

        <div className={styles.modalActions}>

          <button
            className={styles.modalCancel}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className={styles.modalDelete}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  )
}

export default DeleteExamModal