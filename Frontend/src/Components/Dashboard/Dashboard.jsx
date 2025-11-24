import React, { useMemo } from "react";
import RevenueLineChart from "./RevenueLineChart";
import ProfitLineChart from "./ProfitLineChart";
import RevenueProfitBar from "./RevenueProfitBar";
import MetricsCards from "./MetricsCards";
import InsightsPanel from "./InsightsPanel";
import JsonPrettyDisplay from "./JsonPrettyDisplay";
import "./dashboard.css";


function detectCurrency(extracted = {}) {
  const txt = JSON.stringify(extracted || {}).toLowerCase();
  if (txt.includes("₹") || txt.includes("inr") || /,\d{2},\d{3}/.test(txt)) return "INR";
  if (txt.includes("$") || txt.includes("usd")) return "USD";
  return "AUTO";
}

function chooseScale(values = [], currency = "AUTO") {
  const max = Math.max(...values.map(v => Math.abs(Number(v) || 0)), 0);
  if (currency === "INR") {
    if (max >= 1e7) return { divisor: 1e7, label: "Cr" }; // crore
    if (max >= 1e5) return { divisor: 1e5, label: "L" };  // lakh
    if (max >= 1e3) return { divisor: 1e3, label: "K" };
    return { divisor: 1, label: "" };
  }

  if (max >= 1e9) return { divisor: 1e9, label: "B" };
  if (max >= 1e6) return { divisor: 1e6, label: "M" };
  if (max >= 1e3) return { divisor: 1e3, label: "K" };
  return { divisor: 1, label: "" };
}

function formatNumberWithUnit(n, currencySym = "$", unitLabel = "") {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "N/A";
  const val = Number(n);

  const formatted = val % 1 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val.toLocaleString();
  return `${currencySym}${formatted}${unitLabel ? ` ${unitLabel}` : ""}`;
}


export default function Dashboard({ extracted = {} }) {
  const revenue = extracted.Revenue || [];
  const profit = extracted["Profit/Loss"] || [];
  const assets = extracted.Assets || [];
  const liabilities = extracted.Liabilities || [];

  const currencyType = detectCurrency(extracted);
  const currencySym = currencyType === "INR" ? "₹" : "$";


  const revenueVals = revenue.map(r => Number(r?.value || 0));
  const profitVals = profit.map(p => Number(p?.value || 0));
  const assetVals = assets.map(a => Number(a?.value || 0));
  const liabilityVals = liabilities.map(l => Number(l?.value || 0));

  const revScale = chooseScale(revenueVals, currencyType);
  const profScale = chooseScale(profitVals, currencyType);
  const assetScale = chooseScale(assetVals, currencyType);
  const liabScale = chooseScale(liabilityVals, currencyType);

  const years = Array.from(new Set([
    ...revenue.map(r => r.year),
    ...profit.map(p => p.year)
  ])).filter(Boolean).sort();

  const chartData = years.map(year => {
    const r = revenue.find(x => x.year === year) || null;
    const p = profit.find(x => x.year === year) || null;
    return {
      year,
      revenue_raw: r?.raw ?? "",
      profit_raw: p?.raw ?? "",
      revenue_scaled: (r && r.value !== null && r.value !== undefined) ? (Number(r.value) / revScale.divisor) : null,
      profit_scaled:  (p && p.value !== null && p.value !== undefined) ? (Number(p.value) / profScale.divisor) : null,
      // keep raw numeric (unscaled) if needed
      revenue_value: r?.value ?? null,
      profit_value: p?.value ?? null
    };
  });


  const latestRev = revenue.length ? revenue[revenue.length - 1] : null;
  const latestProf = profit.length ? profit[profit.length - 1] : null;
  const metrics = {
    revenue: latestRev && latestRev.value !== null ? (Number(latestRev.value) / revScale.divisor) : null,
    profit:  latestProf && latestProf.value !== null ? (Number(latestProf.value) / profScale.divisor) : null,
    revenueUnitLabel: revScale.label,
    profitUnitLabel: profScale.label,
    revenueLatestLabel: latestRev ? latestRev.year : "",
    profitLatestLabel: latestProf ? latestProf.year : "",
    profitMargin: (latestRev && latestProf && Number(latestRev.value) !== 0)
      ? ((Number(latestProf.value) / Number(latestRev.value)) * 100).toFixed(2)
      : null,
    assets: assets.length ? assets[assets.length - 1].value : null,
    assetsUnitLabel: assetScale.label,
    liabilities: liabilities.length ? liabilities[liabilities.length - 1].value : null,
    liabilitiesUnitLabel: liabScale.label
  };


  const currencyFormatter = (n, unitLabel = "") => formatNumberWithUnit(Number(n), currencySym, unitLabel);

  const hasChartData = chartData.length > 0 && chartData.some(d => Number.isFinite(d.revenue_scaled) || Number.isFinite(d.profit_scaled));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Financial Dashboard</h2>
        <div style={{ fontSize: 12, color: "#9fe9d2" }}>
          Revenue Unit: {currencySym}{metrics.revenueUnitLabel || "-"} &nbsp; • &nbsp; Profit Unit: {currencySym}{metrics.profitUnitLabel || "-"}
        </div>
      </div>

      <MetricsCards metrics={metrics} currencySym={currencySym} />

      <div className="json-and-charts">
        <div className="json-pane">
          <h3 style={{ marginBottom: 12 }}>Extracted JSON</h3>
          <JsonPrettyDisplay
            data={extracted}
   
            currencyFormatter={(val, field) => {
              if (field && /revenue/i.test(field)) return currencyFormatter(val, metrics.revenueUnitLabel);
              if (field && /profit/i.test(field)) return currencyFormatter(val, metrics.profitUnitLabel);
              if (field && /asset/i.test(field)) return currencyFormatter(val, metrics.assetsUnitLabel);
              if (field && /liab/i.test(field)) return currencyFormatter(val, metrics.liabilitiesUnitLabel);
              // fallback
              return currencyFormatter(val, "");
            }}
          />
        </div>

        <div className="charts-pane">
          <div className="charts-row">
            <div className="chart-box">
              <h4 className="chart-title">Revenue Trend ({currencySym}{metrics.revenueUnitLabel})</h4>
              <RevenueLineChart data={chartData} unitLabel={metrics.revenueUnitLabel} currencySym={currencySym} />
            </div>

            <div className="chart-box">
              <h4 className="chart-title">Profit / Loss Trend ({currencySym}{metrics.profitUnitLabel})</h4>
              <ProfitLineChart data={chartData} unitLabel={metrics.profitUnitLabel} currencySym={currencySym} />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-box wide">
              <h4 className="chart-title">Revenue vs Profit ({currencySym}{metrics.revenueUnitLabel} / {currencySym}{metrics.profitUnitLabel})</h4>
              <RevenueProfitBar
                data={chartData}
                revenueUnitLabel={metrics.revenueUnitLabel}
                profitUnitLabel={metrics.profitUnitLabel}
                currencySym={currencySym}
              />
            </div>
          </div>

          {!hasChartData && (
            <div className="no-chart-msg">Not enough numeric data to display charts. Run analysis and click Visualize.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <InsightsPanel insights={extracted.Insights || extracted.insights || []} />
      </div>
    </div>
  );
}
