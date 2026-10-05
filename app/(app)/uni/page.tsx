import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AttendanceMarker } from "@/components/uni/attendance-marker"
import { GradeDrawer } from "@/components/uni/grade-drawer"
import { SubjectDrawer } from "@/components/uni/subject-drawer"
import { getAttendance, getGrades, getSubjects } from "@/lib/data/uni"
import { addDays } from "@/lib/dates"
import { letter, percentColor, subjectStats } from "@/lib/grades"
import { getToday } from "@/lib/today"
import type { Subject } from "@/lib/types"
import { t } from "@/messages/ru"

export default async function UniPage() {
  const today = await getToday()
  const [subjects, attendance, grades] = await Promise.all([getSubjects(), getAttendance(), getGrades()])

  const active = subjects.filter((s) => !s.archived)
  const archived = subjects.filter((s) => s.archived)
  // Для блока «Отметить пару» хватит отметок за сегодня и вчера
  const recent = attendance.filter((a) => a.date >= addDays(today, -1))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t.nav.uni}</h1>

      {active.length > 0 && <AttendanceMarker subjects={active} attendance={recent} today={today} />}

      <div className="grid grid-cols-2 gap-3">
        <GradeDrawer
          subjects={active}
          today={today}
          trigger={
            <Button className="h-14 text-base" disabled={active.length === 0}>
              <Plus /> {t.uni.addGrade}
            </Button>
          }
        />
        <SubjectDrawer
          trigger={
            <Button variant="outline" className="h-14 text-base">
              <Plus /> {t.uni.addSubject}
            </Button>
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-muted-foreground">{t.uni.subjects}</h2>
        {active.length === 0 && <p className="text-muted-foreground">{t.uni.noSubjects}</p>}
        {active.map((s) => (
          <SubjectCard
            key={s.id}
            subject={s}
            stats={subjectStats(
              attendance.filter((a) => a.subject_id === s.id),
              grades.filter((g) => g.subject_id === s.id)
            )}
          />
        ))}
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">{t.uni.archived}</h2>
          {archived.map((s) => (
            <Link key={s.id} href={`/uni/${s.id}`} className="rounded-2xl bg-card/50 p-4 text-muted-foreground">
              {s.name}
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}

function SubjectCard({ subject, stats }: { subject: Subject; stats: ReturnType<typeof subjectStats> }) {
  return (
    <Link href={`/uni/${subject.id}`} className="flex flex-col gap-2 rounded-2xl bg-card p-4">
      <span className="font-medium">{subject.name}</span>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">{t.uni.attendance}</div>
          {stats.percent === null ? (
            <div className="text-muted-foreground">{t.uni.noData}</div>
          ) : (
            <div>
              <span className={`text-lg font-semibold ${percentColor(stats.percent)}`}>{stats.percent}%</span>{" "}
              <span className="text-muted-foreground">
                ({stats.attended}/{stats.total})
              </span>
            </div>
          )}
        </div>
        <div>
          <div className="text-muted-foreground">{t.uni.average}</div>
          {stats.avg === null ? (
            <div className="text-muted-foreground">{t.uni.noData}</div>
          ) : (
            <div>
              <span className="text-lg font-semibold">{stats.avg}</span>{" "}
              <span className="text-muted-foreground">· {letter(stats.avg)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
