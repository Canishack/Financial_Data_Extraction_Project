import React from "react";
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function RevenueProfitBar({ data = [], revenueUnitLabel = "", profitUnitLabel = "", currencySym = "$" }) {
  // derive nice domains if there is numeric data
  const revVals = data.map(d => d.revenue_scaled).filter(v => Number.isFinite(v));
  const profVals = data.map(d => d.profit_scaled).filter(v => Number.isFinite(v));
  const revMax = revVals.length ? Math.max(...revVals) : 0;
  const profMax = profVals.length ? Math.max(...profVals) : 0;
  const leftDomain = [0, Math.ceil((revMax || 1) * 1.2)];
  const rightDomain = [Math.min(...(profVals.length ? profVals : [0])) * 1.2, Math.ceil((profMax || 1) * 1.2)];

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data} margin={{ top: 16, right: 32, left: 20, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="year" tick={{ fill: '#9fb' }} />
        <YAxis yAxisId="left" tick={{ fill: '#9fb' }} domain={leftDomain} label={{ value: `${currencySym}${revenueUnitLabel}`, angle: -90, position: 'insideLeft', fill: '#9fb' }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9fb' }} domain={rightDomain} label={{ value: `${currencySym}${profitUnitLabel}`, angle: 90, position: 'insideRight', fill: '#9fb' }} />
        <Tooltip formatter={(val, name) => [`${currencySym}${val}`, name]} />
        <Legend wrapperStyle={{ color: '#9fffe8' }} />
        <Bar yAxisId="left" dataKey="revenue_scaled" name={`Revenue (${revenueUnitLabel})`} fill="#4ea8ff" barSize={36} />
        <Bar yAxisId="right" dataKey="profit_scaled" name={`Profit (${profitUnitLabel})`} fill="#7fffd4" barSize={24} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
