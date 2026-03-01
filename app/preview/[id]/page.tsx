import { getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamPreviewComponent from "@/components/ExamPreviewComponent";

interface ExamSessionPageProps {
  params: Promise<{ id: string}>;
}

const ExamSession = async({ params }: ExamSessionPageProps) => {
  const { id } = await params;
  const exam = await getExam(id);
  console.log('exam preview = ', exam);

  const user = await currentUser();

  if(!user) redirect('/sign-in');
  if(!exam.title) redirect('/preview');

  return (
    <ExamPreviewComponent
      id={id}
      exam={exam}
      userId={user.id}
      readOnly
    />
  )
}

export default ExamSession