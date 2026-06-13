"use client"

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts"

export interface RadarDatum {
  axis: string
  first: number
  last: number
}

const PAST = "#9A9389"    // 첫 회: muted (text-muted)
const CURRENT = "#66788E" // 최근: primary

function RadarTooltip({ active, payload, label, firstLabel, lastLabel, max }: any) {
  if (!active || !payload?.length) return null
  const first = payload.find((p: any) => p.dataKey === "first")?.value
  const last = payload.find((p: any) => p.dataKey === "last")?.value
  const diff = typeof first === "number" && typeof last === "number" ? last - first : null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{firstLabel} {first}/{max} → {lastLabel} {last}/{max}</p>
      {diff != null && diff !== 0 && (
        <p className={diff > 0 ? "text-emerald-600" : "text-red-500"}>
          {diff > 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}
        </p>
      )}
    </div>
  )
}

/**
 * 첫 회 vs 최근 항목 점수를 두 겹으로 겹쳐 보여주는 성장 프로파일 레이더.
 * 축이 3개 미만이면 다각형이 만들어지지 않아 렌더하지 않는다.
 */
export function GrowthRadar({
  data,
  max = 5,
  firstLabel = "첫 회",
  lastLabel = "최근",
  height = 300,
}: {
  data: RadarDatum[]
  max?: number
  firstLabel?: string
  lastLabel?: string
  height?: number
}) {
  if (data.length < 3) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="68%">
        <PolarGrid stroke="#D8D3CC" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: "#9A9389" }} />
        <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
        <Radar
          name={firstLabel} dataKey="first"
          stroke={PAST} fill={PAST} fillOpacity={0.18} strokeWidth={1.5}
        />
        <Radar
          name={lastLabel} dataKey="last"
          stroke={CURRENT} fill={CURRENT} fillOpacity={0.32} strokeWidth={2}
        />
        <Tooltip content={<RadarTooltip firstLabel={firstLabel} lastLabel={lastLabel} max={max} />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
      </RadarChart>
    </ResponsiveContainer>
  )
}
