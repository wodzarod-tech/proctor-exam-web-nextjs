//import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExamComponent from "@/components/ExamComponent";
import { getUser } from "@/lib/auth/user-server";
import { getUserProfile } from "@/lib/auth/user-client";

const NewExam = async() => {
  //const user = await currentUser();
  //if(!user) redirect('/sign-in');
  const user = await getUser();
  if(!user) redirect('/login');
  console.log("NewExam.user.id=", user.id);
  
  const profile = getUserProfile(user);
  console.log("NewExam profile=",profile);

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