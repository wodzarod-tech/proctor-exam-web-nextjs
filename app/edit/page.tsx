import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";
import { getUser } from "@/lib/auth/user-server";
import { getUserProfile } from "@/lib/auth/user-client";

const NewExam = async() => {
  const user = await getUser();

  if(!user) redirect('/login');
  
  const profile = getUserProfile(user);

  return (
    <ExamComponent
      id={null}
      exam={null}
      userId={user.id}
      profile={profile}
    />
  )
}

export default NewExam