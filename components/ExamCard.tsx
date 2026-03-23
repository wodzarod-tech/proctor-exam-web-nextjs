'use client';

import Image from "next/image";
import Link from "next/link";
import { useDeleteExam } from "@/hooks/useDeleteExam"
import DeleteExamModal from "@/components/DeleteExamModal/DeleteExamModal"
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { setUser, User } from "@sentry/nextjs";

/***************************
Types
***************************/
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

// get user
const [user, setUser] = useState<User | null>(null)
useEffect(() => {
  const supabase = getSupabaseBrowserClient()

  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user)
  })
}, [])

// Show time limit
// ---------------------------
const hours = settings?.timer?.hours ?? 0;
const minutes = settings?.timer?.minutes ?? 0;
 
const durationLabel = (() => {
  if(hours==0 && minutes==0) {
    return "No time limit"
  }

  const hourLabel =
    hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "";

  const minuteLabel =
    minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";

  return [hourLabel, minuteLabel].filter(Boolean).join(" ");
})()

// Delete exam
const { isDeleteOpen, setIsDeleteOpen, deleting, handleDelete } = useDeleteExam(user)

/***************************
Render
***************************/
return (
  <>
  <article className="companion-card" style={{backgroundColor: color}}>
    <div className="flex justify-between items-center">

      <div className="subject-badge">{title}</div>

      <div className="flex items-center">

        {/* Edit */}
        <Link
          href={`/edit/${id}`}
          className="icon-btn g-tooltip"
          data-tooltip="Edit exam">
          <i className="fa fa-pen text-sm"></i>
        </Link>

        {/* Delete */}
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
        width={14}
        height={14}
      />
      <p className="text-sm">{durationLabel}</p>
      
    </div>

    <Link href={`/exam/${id}`} className="w-full">
      <button className="btn-primary w-full justify-center">
        Take Exam
      </button>
    </Link>

  </article>

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
  </>
);
};

export default ExamCard