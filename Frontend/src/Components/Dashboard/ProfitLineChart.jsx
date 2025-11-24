import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function ProfitLineChart({ data = [], unitLabel = "", currencySym = "$" }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="year" tick={{ fill: '#9fb' }} />
        <YAxis tick={{ fill: '#9fb' }} />
        <Tooltip formatter={(val) => [`${currencySym}${val} ${unitLabel}`, `Profit (${unitLabel})`]} />
        <Line type="monotone" dataKey="profit_scaled" stroke="#6ef0b8" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
