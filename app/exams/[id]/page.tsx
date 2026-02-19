//localhost:3000/companions/[id]
// Companion Session page

import { getCompanion, getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import ExamSession from "@/components/ExamSession";
//import CompanionComponent from "@/components/CompanionComponent";

interface CompanionSessionPageProps {
  params: Promise<{ id: string}>;
}

// params vs searchParams:
// params: /url/{id} -> id
// searchParams: /url?key=value&key1=value1

const CompanionSession = async({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const companion = await getExam(id);
  const user = await currentUser();

  const { title, description, questions, settings } = companion;

  if(!user) redirect('/sign-in');
  if(!title) redirect('/exams');

  //console.log(name);

  return (
    <ExamSession
      exam={companion}
      userId={user.id}
    />
  )
}

export default CompanionSession