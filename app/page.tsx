//localhost:3000

import { getUserExams } from "@/lib/actions/exam.actions";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import ExamCard from "@/components/ExamCard";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/auth/user-server";
import FeedbackModal from "@/components/feedback/FeedbackModal";

const Page = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  /*
  filters: get the parameters from the URL
  http://localhost:3000/?title=APX
  */

  const title = filters.title ? filters.title : '';
  //const exams = await getAllExams({ title });
  const user = await getUser();

  // Get ONLY user's exams
  let exams = null;
  if(user)
    exams = await getUserExams(user.id, title);
  
  const MAX_EXAMS = 20;
  const examCount = exams?.length || 0;
  const canCreate = examCount < MAX_EXAMS;

  return (
    <>
    <Navbar user={user} />
    <main>
      {/*<section className="flex items-center gap-6">*/}
      <section className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center justify-between w-full sm:w-auto">
          {/*<h1 className="whitespace-nowrap">*/}
          <h1 className="whitespace-nowrap text-2xl sm:text-3xl">
            My Exams 
            {user && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                ({examCount})
              </span>
            )}
          </h1>

          {/* Show Create button next to title ONLY on mobile */}
          <div className="sm:hidden">
            <Link
              href={canCreate ? "/edit" : "#"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                canCreate ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500"
              }`}
            >
              + Create
            </Link>
          </div>
        </div>

        <div className="flex-1">
          <SearchInput />
        </div>

        {/* Hide this version of the button on mobile, show on desktop */}
        <div className="hidden sm:block">
          <Link
            href={canCreate ? "/edit" : "#"}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              canCreate
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
            }`}
          >Create Exam
          </Link>
        </div>
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