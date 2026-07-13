"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3F7D58", "#B3462C", "#B08420", "#1F2A44"];

export function AttendanceBarChart({
  data,
}: {
  data: { date: string; present: number; absent: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Bar dataKey="present" name="Present" fill="#3F7D58" radius={[3, 3, 0, 0]} />
        <Bar dataKey="absent" name="Absent" fill="#B3462C" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPieLabel({ name, percent }: any) {
  return (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : "";
}

export function FeeStatusPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          label={renderPieLabel}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
