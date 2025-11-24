export default function MetricsCards({ metrics = {}, currencySym = "$" }) {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-title">Revenue (Latest: {metrics.revenueLatestLabel || "-"})</div>
        <div className="metric-value">{metrics.revenue !== null ? `${currencySym}${metrics.revenue} ${metrics.revenueUnitLabel || ""}` : "N/A"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-title">Profit / Loss (Latest: {metrics.profitLatestLabel || "-"})</div>
        <div className="metric-value">{metrics.profit !== null ? `${currencySym}${metrics.profit} ${metrics.profitUnitLabel || ""}` : "N/A"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-title">Profit Margin</div>
        <div className="metric-value">{metrics.profitMargin ? `${metrics.profitMargin}%` : "-"}</div>
      </div>

      <div className="metric-card">
        <div className="metric-title">Total Assets</div>
        <div className="metric-value">
          {metrics.assets !== null && metrics.assets !== undefined ? `${currencySym}${(metrics.assets).toLocaleString()} ${metrics.assetsUnitLabel || ""}` : "N/A"}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-title">Total Liabilities</div>
        <div className="metric-value">
          {metrics.liabilities !== null && metrics.liabilities !== undefined ? `${currencySym}${(metrics.liabilities).toLocaleString()} ${metrics.liabilitiesUnitLabel || ""}` : "N/A"}
        </div>
      </div>
    </div>
  );
}
