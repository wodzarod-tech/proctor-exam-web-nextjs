import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const uid = () => crypto.randomUUID()

export function createEmptyQuestion() {
  return {
    id: uid(),
    text: '',
    type: 'radio',
    points: 0,
    required: false,
    options: [
      { id: uid(), text: '', checked: false, image: "" }
    ],
    feedbackOk: '',
    feedbackError: '',
    image: ''
  }
}