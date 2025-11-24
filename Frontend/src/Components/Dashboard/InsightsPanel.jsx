export default function InsightsPanel({ insights }) {
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return (
      <div className="insights-box">
        <div className="insights-title">Insights</div>
        <div className="insights-empty">No insights available.</div>
      </div>
    );
  }

  return (
    <div className="insights-box">
      <div className="insights-title">Insights</div>

      <ul className="insights-list">
        {insights.map((text, i) => (
          <li key={i} className="insight-item">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
