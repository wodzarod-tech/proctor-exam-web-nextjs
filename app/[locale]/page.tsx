//localhost:3000

import { getAllExams, getUserExams } from "@/lib/actions/exam.actions";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import ExamCard from "@/components/ExamCard";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getUser } from "@/lib/auth/user-server";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { getUserProfile } from "@/lib/auth/user-client";
import { getTranslations } from "next-intl/server";
//import { useTranslations } from "next-intl";

const Page = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  /*
  filters: get the parameters from the URL
  http://localhost:3000/?title=APX
  console.log('PARAMS: ', filters);
  */

  const title = filters.title ? filters.title : '';
  //const exams = await getAllExams({ title });
  const user = await getUser();
  console.log("Page user=", user);
  //let profile = null;

  // Get ONLY user's exams
  let exams = null;
  if(user)
    exams = await getUserExams(user.id, title);
    //profile = getUserProfile(user);
  
  const MAX_EXAMS = 20;
  const examCount = exams?.length || 0;
  const canCreate = examCount < MAX_EXAMS;
  const t = await getTranslations()
  //const t = useTranslations();
  
  return (
    <>
    <Navbar user={user} />
    <main>
      <section className="flex items-center gap-6">
        <h1 className="whitespace-nowrap">
          {t('home.search')}
          {user && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
              ({examCount})
            </span>
          )}
        </h1>

        <div className="flex-1">
          <SearchInput />
        </div>
        <Link
          href={canCreate ? "/edit" : "#"}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            canCreate
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
          }`}
        >Create Exam
        </Link>
      </section>

      {/* limit max exams */}
      {user && !canCreate && (
        <p className="text-sm text-red-500 mt-2">
          {examCount} / {MAX_EXAMS} exams used
        </p>
      )}

      {user ? (
        <section className="exams-grid">
          {exams?.map((exam) => (
            <ExamCard
              key={exam.id}
              {...exam}
              color={getSubjectColor(exam.title)}
              />
          ))}
        </section>
      ) : (
        <p className="text-center mt-10">Please sign in to see your exams</p>
      )}
    </main>

    <FeedbackModal 
      userId={user?.id}
      examId=""
    />
    </>
  )
}

export default Page