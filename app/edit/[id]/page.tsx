import { getExam } from "@/lib/actions/exam.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";
import { getUser } from "@/lib/auth/user-server";

interface EditExamPageProps {
  params: { id: string};
}

const EditExam = async({ params }: EditExamPageProps) => {
  //const user = await currentUser();
  //if(!user) redirect('/sign-in');
  const user = await getUser();
  if(!user) redirect('/login');

  const { id } = await params;
  const exam = await getExam(id);

  return (
    <ExamComponent
      id={id}
      exam={exam}
      userId={user.id}
    />
  )
}

export default EditExam