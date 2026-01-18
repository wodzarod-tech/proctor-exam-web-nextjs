"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
  }, []);

  return (
    <main className="page-container">
      <h1>Proctor Exam</h1>

      <div className="proctor-brand">
        <Image
          src="/logo.png"
          alt="Proctor Exam"
          width={120}
          height={120}
          className="proctor-logo"
          priority
        />
        <p className="proctor-tagline">
          Secure exams. Simple forms
        </p>
      </div>

      <div className="button-row">
        <Button
          className="start-btn"
          size="lg"
          onClick={() => router.push("/start")}
        >
          Take Exam
        </Button>

        <Button
          className="create-btn"
          size="lg"
          onClick={() => router.push("/create")}
        >
          Create / Edit Exam
        </Button>
      </div>
    </main>
  );
}
