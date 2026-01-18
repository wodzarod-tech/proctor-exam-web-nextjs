"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateExamPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-3xl font-bold">Create / Edit Exam</h1>

      <p className="text-sm text-muted-foreground max-w-md text-center">
        Here you will be able to create new exams, edit existing ones,
        configure questions, timing, and proctoring rules.
      </p>

      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={() => router.push("/create/new")}
        >
          Create New Exam
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
