import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/Icon'
import { Button, Card, Page } from '../../components/Page'
import { SampleDataBanner } from '../../components/SampleDataBanner'
import { regionGroups, tripStat } from '../../lib/stats'
import { useStore } from '../../store/useStore'
import { RegionCompare } from './RegionCompare'
import { TripCard } from './TripCard'
import { TripFormSheet } from './TripFormSheet'

export function TripsPage() {
  const navigate = useNavigate()
  const trips = useStore((s) => s.trips)
  const expenses = useStore((s) => s.expenses)
  const [formOpen, setFormOpen] = useState(false)

  const stats = useMemo(
    () => trips.map((t) => tripStat(t, expenses)).sort((a, b) => b.trip.startDate.localeCompare(a.trip.startDate)),
    [trips, expenses],
  )
  const groups = useMemo(() => regionGroups(stats), [stats])

  return (
    <Page
      title="여행"
      right={
        <Button onClick={() => setFormOpen(true)}>
          <Icon name="plus" className="size-4" /> 새 여행
        </Button>
      }
    >
      <SampleDataBanner />
      {stats.length === 0 ? (
        <Card className="text-center text-sm text-neutral-500">
          <p>아직 여행이 없어요.</p>
          <p className="mt-1 text-xs">
            "새 여행"으로 만들거나, 주간 입력에서 지출을 체크한 뒤 "✈ 여행 태그"로 만들 수 있어요.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-500">지역별 비교</h2>
              <div className="space-y-3">
                {groups.map((g) => (
                  <RegionCompare key={g.region} group={g} />
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-neutral-500">전체 여행 {stats.length}개</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((s) => (
                <TripCard key={s.trip.id} stat={s} />
              ))}
            </div>
          </section>
        </div>
      )}
      <TripFormSheet open={formOpen} onClose={() => setFormOpen(false)} onSaved={(t) => navigate(`/trips/${t.id}`)} />
    </Page>
  )
}
