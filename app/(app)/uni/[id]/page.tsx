import Link from "next/link"
import { notFound } from "next/navigation"
import { Check, ChevronLeft, Pencil, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/uni/delete-button"
import { GradeDrawer } from "@/components/uni/grade-drawer"
import { SubjectDrawer } from "@/components/uni/subject-drawer"
import { getAttendance, getGrades, getSubject, getSubjects } from "@/lib/data/uni"
import { formatDay } from "@/lib/dates"
import { letter, percentColor, subjectStats } from "@/lib/grades"
import { getToday } from "@/lib/today"
import { t } from "@/messages/ru"

export default async function SubjectPage({ params }: PageProps<"/uni/[id]">) {
  const { id } = await params
  const today = await getToday()
  const [subject, subjects, attendance, grades] = await Promise.all([
    getSubject(id),
    getSubjects(),
    getAttendance(id),
    getGrades(id),
  ])
  if (!subject) notFound()

  const stats = subjectStats(attendance, grades)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/uni" className="-ml-1 flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> {t.uni.back}
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">{subject.name}</h1>
            {subject.archived && <p className="text-sm text-muted-foreground">{t.uni.archivedBadge}</p>}
          </div>
          <SubjectDrawer
            subject={subject}
            trigger={
              <Button variant="ghost" size="icon-lg" aria-label={t.uni.editSubject}>
                <Pencil />
              </Button>
            }
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4">
          <div className="text-sm text-muted-foreground">{t.uni.attendance}</div>
          <div className={`text-xl font-semibold ${percentColor(stats.percent)}`}>
            {stats.percent === null ? "—" : `${stats.percent}%`}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.attended}/{stats.total}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <div className="text-sm text-muted-foreground">{t.uni.average}</div>
          <div className="text-xl font-semibold">{stats.avg ?? "—"}</div>
          {stats.avg !== null && <div className="text-sm text-muted-foreground">{letter(stats.avg)}</div>}
        </div>
      </div>

      {!subject.archived && (
        <GradeDrawer
          subjects={subjects.filter((s) => !s.archived)}
          today={today}
          defaultSubjectId={subject.id}
          trigger={
            <Button className="h-14 text-lg">
              <Plus className="size-5" /> {t.uni.addGrade}
            </Button>
          }
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.uni.grades}</h2>
        {grades.length === 0 && <p className="text-muted-foreground">{t.uni.noGrades}</p>}
        {grades.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-xl bg-card py-2 pr-1 pl-4">
            <div className="w-14 text-center">
              <div className="text-lg font-semibold">{g.grade}</div>
              <div className="text-xs text-muted-foreground">{letter(g.grade)}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div>{t.uni.kinds[g.kind]}</div>
              <div className="text-sm text-muted-foreground first-letter:uppercase">{formatDay(g.date)}</div>
              {g.note && <div className="text-sm text-muted-foreground">{g.note}</div>}
            </div>
            <DeleteButton kind="grade" id={g.id} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm text-muted-foreground">{t.uni.attendanceHistory}</h2>
        {attendance.length === 0 && <p className="text-muted-foreground">{t.uni.noAttendance}</p>}
        {attendance.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl bg-card py-1 pr-1 pl-4">
            {a.attended ? <Check className="size-5 text-emerald-400" /> : <X className="size-5 text-red-400" />}
            <span className="flex-1 first-letter:uppercase">{formatDay(a.date)}</span>
            <span className="text-sm text-muted-foreground">{a.attended ? t.uni.attended : t.uni.missed}</span>
            <DeleteButton kind="attendance" id={a.id} />
          </div>
        ))}
      </section>
    </div>
  )
}
