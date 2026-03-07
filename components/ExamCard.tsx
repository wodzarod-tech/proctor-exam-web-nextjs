'use client';

import Image from "next/image";
import Link from "next/link";
import { deleteExam } from "@/lib/actions/exam.actions"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react";
import styles from "./ExamCard.module.css";

interface ExamCardProps {
  id: string;
  title: string;
  description: string;
  questions: string;
  settings: {
    timer: {
      enabled: boolean;
      hours: number;
      minutes: number;
    };
  };
  color: string;
}

const ExamCard = ({
  id,
  title,
  description,
  questions,
  settings,
  color
}: ExamCardProps) => {

  const hours = settings?.timer?.hours ?? 0;
  const minutes = settings?.timer?.minutes ?? 0;

  console.log("hours=",hours);
  console.log("minutes=",minutes);

  let durationLabel = "No time limit";
    
  if(!((hours==0 && minutes==0) || (hours!=0 && minutes==0))) {
    const hourLabel =
      hours > 0
        ? `${hours} hour${hours === 1 ? "" : "s"}`
        : "";

    const minuteLabel =
      minutes > 0
        ? `${minutes} minute${minutes === 1 ? "" : "s"}`
        : "";

    durationLabel = [hourLabel, minuteLabel]
      .filter(Boolean)
      .join(" ");
  }

  // Delete exam
  // For delete an exam
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const router = useRouter()

  const handleDelete = async () => {
    try {
      await deleteExam(id)
      router.refresh() // refresh page to remove card
    } catch (error) {
      console.error(error)
      setMsgNav("❌ Failed to delete exam")
    }
  }

  // Duration for messages
  const [msg, setMsg] = useState<string>("");
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function setMsgNav(message: string) {
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

  return (
    <>
    <article className="companion-card" style={{backgroundColor: color}}>
      <div className="flex justify-between items-center">
        <div className="subject-badge">{title}</div>

        <div className="flex items-center">
          {/* Edit Button */}
          <Link
            href={`/edit/${id}`}
            className="icon-btn g-tooltip"
            data-tooltip="Edit exam">
            <i className="fa fa-pen text-sm"></i>
          </Link>

          {/* Delete Button */}
          <button
            className="icon-btn g-tooltip"
            data-tooltip="Delete exam"
            onClick={() => setIsDeleteOpen(true)}>
            <i className="fa fa-trash text-sm"></i>
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold">{description}</h2>
      <div className="flex items-center gap-2">
        <Image
          src="/icons/clock.svg"
          alt="duration"
          width={13.5}
          height={13.5}
        />
        <p className="text-sm">{durationLabel}</p>
      </div>

      <Link href={`/exam/${id}`} className="w-full">
        <button className="btn-primary w-full justify-center">
          Take Exam
        </button>
      </Link>

    </article>

    {/* delete exam modal*/}
    {isDeleteOpen && (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmModal}>

        <h3>Delete exam?</h3>

        <p>
          Are you sure you want to delete this exam?  
        </p>

        <div className={styles.modalActions}>

          <button
            className={styles.modalCancel}
            onClick={() => setIsDeleteOpen(false)}
          >
            Cancel
          </button>

          <button
            className={styles.modalDelete}
            onClick={async () => {
              await handleDelete()
              setIsDeleteOpen(false)
            }}
          >
            Delete
          </button>

        </div>

      </div>
    </div>
    )}
    </>
  );
};

export default ExamCard