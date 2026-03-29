//localhost:3000

import { getUserExams } from "@/lib/actions/exam.actions";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import ExamCard from "@/components/ExamCard";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/auth/user-server";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import Image from "next/image";

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
      <section className="mt-12 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Master your exams in 3 simple steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl px-4">
          
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
            <h3 className="text-xl font-bold mb-2">Create Your Exam</h3>
            <p className="text-gray-600 mb-6">Build custom question banks with images and multiple choice options.</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md border">
              <Image src="/images/step-1.png" alt="Create Exam" fill className="object-cover" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
            <h3 className="text-xl font-bold mb-2">Test Your Exam</h3>
            <p className="text-gray-600 mb-6">Simulate real proctor conditions with timers and distraction-free mode.</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md border">
              <Image src="/images/step-2.png" alt="Test Exam" fill className="object-cover" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
            <h3 className="text-xl font-bold mb-2">Win Your Exam</h3>
            <p className="text-gray-600 mb-6">Analyze your results and pass your real certification with ease.</p>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md border">
              <Image src="/images/step-3.png" alt="Win Exam" fill className="object-cover" />
            </div>
          </div>

        </div>

        <div className="mt-24 flex flex-col items-center w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Take a look inside</h2>

          {/* The Teaser Image */}
          <div className="relative w-full max-w-2xl aspect-video mb-8 rounded-xl overflow-hidden shadow-2xl border border-gray-100">
            <Image
              src="/images/all-exams.png" // Make sure to put your image in /public/images/
              alt="Exam Dashboard Preview"
              fill
              className="object-cover"
              priority
            />
            {/* Optional Overlay to make it look "Locked" */}
            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white/90 p-4 rounded-full shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="Wait, you need to sign in!"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
              </div>
            </div>
          </div>

          {/* The Text & Button */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to master your exams?</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Sign in to create question banks, simulate proctored tests, and track your progress.
          </p>

          <Link 
            href="/login" 
            className="mt-16 bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl hover:scale-105 transform"
          >
            Get Started for Free
          </Link>
        </div>
      </section>
      )}
    </main>
    {/*<p className="text-center mt-10">Please sign in to see your exams</p>*/}

    <FeedbackModal 
      userId={user?.id}
      examId=""
    />
    </>
  )
}

export default Page