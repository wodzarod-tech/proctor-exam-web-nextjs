//localhost:3000

import { getAllExams } from "@/lib/actions/exam.actions";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import ExamCard from "@/components/ExamCard";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const Page = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  /*
  filters: get the parameters from the URL
  http://localhost:3000/?title=APX
  console.log('PARAMS: ', filters);
  */

  const title = filters.title ? filters.title : '';
  const exams = await getAllExams({ title });

  return (
    <>
    <Navbar />
    <main>
      <section className="flex items-center gap-6">
        <h1 className="whitespace-nowrap">Exam Library</h1>

        <div className="flex-1">
          <SearchInput />
        </div>
        <Link
          href="/create"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          + Create Exam
        </Link>
      </section>
      <section className="exams-grid">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            {...exam}
            color={getSubjectColor(exam.title)}
            />
        ))}
      </section>
    </main>
    </>
  )
}

export default Page