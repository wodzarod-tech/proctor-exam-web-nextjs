import { getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

interface EditExamPageProps {
  params: Promise<{ id: string}>;
}

const EditExam = async({ params }: EditExamPageProps) => {
  const { id } = await params;
  const exam = await getExam(id);
  console.log('exam = ', exam);

  const user = await currentUser();

  if(!user) redirect('/sign-in');
  if(!exam.title) redirect('/');

  return (
    <ExamComponent
      id={id}
      exam={exam}
      userId={user.id}
    />
  )
}

export default EditExam