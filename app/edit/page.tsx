import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

const NewExam = async() => {
  const user = await currentUser();
  console.log("user=", user);
  if(!user) redirect('/sign-in');

  return (
    <ExamComponent
      id={null}
      exam={null}
      userId={user.id}
    />
  )
}

export default NewExam