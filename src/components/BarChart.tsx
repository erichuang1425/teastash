interface BarChartDatum {
  label: string
  value: number
}

export function BarChart({ data }: { data: BarChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-36 items-end gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-28 w-full items-end">
            <div
              className="w-full rounded-t-md bg-matcha/80 transition-[height]"
              style={{ height: `${d.value === 0 ? 2 : Math.max(6, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${d.value}g`}
            />
          </div>
          <span className="text-[10.5px] font-medium text-ink/45">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
