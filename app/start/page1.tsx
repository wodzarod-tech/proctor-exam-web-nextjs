"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function StartExamPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-3xl font-bold">Start Exam</h1>

      <p className="text-sm text-muted-foreground max-w-md text-center">
        Enter your exam access code to begin. Make sure your camera,
        microphone, and internet connection are ready before starting.
      </p>

      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={() => router.push("/start/exam")}
        >
          Enter Exam Code
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </div>
    </main>
  );
}
