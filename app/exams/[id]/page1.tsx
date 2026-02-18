//localhost:3000/companions/[id]
// Companion Session page

import { getCompanion, getExam } from "@/lib/actions/companion.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import ExamCard from "@/components/ExamCard";
//import CompanionComponent from "@/components/CompanionComponent";

interface CompanionSessionPageProps {
  params: Promise<{ id: string}>;
}

// params vs searchParams:
// params: /url/{id} -> id
// searchParams: /url?key=value&key1=value1

const CompanionSession1 = async({ params }: CompanionSessionPageProps) => {
  const { id } = await params;
  const companion = await getExam(id);
  const user = await currentUser();

  const { title, description, questions, settings } = companion;

  if(!user) redirect('/sign-in');
  if(!title) redirect('/exams');

  //console.log(name);

  return (
    <main>
      <article className="flex rounded-border justify-between p-6 max-md:flex-col">
        <div className="flex items-center gap-2">
          <div className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden" style={{ backgroundColor:getSubjectColor(description)}}>
          {/* for desktop devices*/}
          <Image src={`/icons/${description}.svg`} alt={description} width={35} height={35} />
          </div>

          {/* for all screen sizes*/}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="font-bold text-2xl">
                {title}
              </p>
              <div className="subject-badge max-sm:hidden">
                {description}
              </div>
            </div>
            <p className="text-lg">{title}</p>
          </div>
        </div>
        <div className="items-start text-2xl max-md:hidden">
          {title} minutes
        </div>
      </article>
      <ExamCard
        key={companion.id}
        {...companion}
        color={getSubjectColor(companion.title)}
      />
{/*
      <CompanionComponent
        {...companion}
        companionId={id}
        userName={user.firstName}
        userImage={user.imageUrl!}
      />
*/}
    </main>
  )
}

export default CompanionSession1