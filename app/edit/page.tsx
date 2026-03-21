import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";

const NewExam = async() => {
  //const user = await currentUser();
  const user = 'e18dfee9-3e99-4cc1-a86a-6d98a3ab1e49';
  console.log("NewExam.user=", user);
  if(!user) redirect('/login');
  //if(!user) redirect('/sign-in');

  return (
    <ExamComponent
      id={null}
      exam={null}
      userId={user.id}
    />
  )
}

export default NewExam