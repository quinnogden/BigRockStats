import { getTotalVoiceHours } from "@brs/db";
import { getDatabase } from "../src/database";

// Voice hours change as people talk; never serve a cached figure.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hours = await getTotalVoiceHours(getDatabase());

  return (
    <main
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "48px 64px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--text-muted)",
          fontSize: 14,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Total voice hours
      </p>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {formatHours(hours)}
      </p>
    </main>
  );
}

function formatHours(hours: number): string {
  return hours.toLocaleString("en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
