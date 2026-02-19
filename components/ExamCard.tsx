'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const handleBookmark = async () => {
  };

  const hours = settings?.timer?.hours ?? 0;
  const minutes = settings?.timer?.minutes ?? 0;

  let durationLabel = "No time limit";
    
  if (settings?.timer?.enabled) {
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

  return (
    <article className="companion-card" style={{backgroundColor: color}}>
      <div className="flex justify-between items-center">
        <div className="subject-badge">{title}</div>
        <button className="companion-bookmark" onClick={handleBookmark}>
          <Image
            src={"/icons/bookmark.svg"            }
            alt="bookmark"
            width={12.5}
            height={15}
          />
        </button>
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

      <Link href={`/exams/${id}`} className="w-full">
        <button className="btn-primary w-full justify-center">
          Take Exam
        </button>
      </Link>

    </article>
  );
};

export default ExamCard