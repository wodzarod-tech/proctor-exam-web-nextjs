import { getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

interface EditExamPageProps {
  params: { id: string};
}

const EditExam = async({ params }: EditExamPageProps) => {
  const user = await currentUser();
  if(!user) redirect('/sign-in');

  const { id } = await params;
  const exam = await getExam(id);

  return (
    <ExamComponent
      id={params.id}
      exam={exam}
      userId={user.id}
    />
  )
}

export default EditExam