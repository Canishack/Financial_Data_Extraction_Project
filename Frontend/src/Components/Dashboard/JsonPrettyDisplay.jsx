import React from "react";

function renderPairValue(fieldName, v, currencyFormatter) {
  if (v === null || v === undefined) return <span style={{ color: '#9aaeb0' }}>N/A</span>;

  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return <div style={{ color: "#dbeef1" }}>{String(v)}</div>;

  if (Array.isArray(v)) {
    const isYearRows =
      v.length > 0 &&
      v.every(it => it && typeof it === "object" && ("year" in it || "raw" in it || "value" in it));

    if (isYearRows) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {v.map((it, i) => {
            const formatted =
              it.value != null && currencyFormatter
                ? currencyFormatter(it.value, fieldName)
                : it.value;

            return (
              <div
                key={i}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ fontWeight: 700, color: "#9df9ef" }}>{it.year}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#cfeee8" }}>{it.raw || it.value}</div>
                  <div style={{ marginTop: 4, color: "#7fffd4", fontWeight: 700 }}>
                    {formatted}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return <pre style={{ whiteSpace: "pre-wrap", color: "#cfeee8" }}>{JSON.stringify(v, null, 2)}</pre>;
  }

  return <pre style={{ whiteSpace: "pre-wrap", color: "#cfeee8" }}>{JSON.stringify(v, null, 2)}</pre>;
}

export default function JsonPrettyDisplay({ data, currencyFormatter }) {
  if (!data) return null;

  return (
    <div style={{ padding: 8 }}>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          <div style={{ minWidth: 140, fontWeight: 800, color: "#3ff6d6" }}>{key}</div>
          <div style={{ flex: 1 }}>{renderPairValue(key, val, currencyFormatter)}</div>
        </div>
      ))}
    </div>
  );
}
