import { getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

interface ExamSessionPageProps {
  params: Promise<{ id: string}>;
}

const ExamSession = async({ params }: ExamSessionPageProps) => {
  const { id } = await params;
  const exam = await getExam(id);
  console.log('exam = ', exam);

  const user = await currentUser();

  if(!user) redirect('/sign-in');
  if(!exam.title) redirect('/edit');

  return (
    <ExamComponent
      exam={exam}
      userId={user.id}
    />
  )
}

export default ExamSession