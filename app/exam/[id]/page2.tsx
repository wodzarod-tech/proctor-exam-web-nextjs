import { getCompanion, getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import ExamSession from "@/components/ExamComponent";

interface CompanionSessionPageProps {
  params: Promise<{ id: string}>;
}

const CompanionSession = async({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const companion = await getExam(id);
  console.log('companion = ', companion);
  const user = await currentUser();

  const { title, description, questions, settings } = companion;

  if(!user) redirect('/sign-in');
  if(!title) redirect('/exam');

  return (
    <ExamSession
      exam={companion}
      userId={user.id}
    />
  )
}

export default CompanionSession