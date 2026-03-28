import { getExam } from "@/lib/actions/exam.actions";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";
import { getUser } from "@/lib/auth/user-server";
import { getUserProfile } from "@/lib/auth/user-client";

interface EditExamPageProps {
  params: { id: string};
}

const EditExam = async({ params }: EditExamPageProps) => {
  const user = await getUser();
  if(!user) redirect('/login');

  const profile = getUserProfile(user);
  const { id } = await params;
  const exam = await getExam(id);

  return (
    <ExamComponent
      id={id}
      exam={exam}
      userId={user.id}
      profile={profile}
    />
  )
}

export default EditExam