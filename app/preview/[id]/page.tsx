import { getExam } from "@/lib/actions/exam.actions";
import { redirect } from "next/navigation";
import ExamPreviewComponent from "@/components/ExamPreviewComponent";
import { getUser } from "@/lib/auth/user-server";

interface ExamSessionPageProps {
  params: Promise<{ id: string}>;
}

const ExamSession = async({ params }: ExamSessionPageProps) => {
  const { id } = await params;
  const exam = await getExam(id);

  const user = await getUser();
  if(!user) redirect('/login');

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