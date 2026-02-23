import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

const NewExam = async() => {
  const user = await currentUser();

  if(!user) redirect('/sign-in');

  return (
    <ExamComponent
      exam={null}
      userId={user.id}
    />
  )
}

export default NewExam