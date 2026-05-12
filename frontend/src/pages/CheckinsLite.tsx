import { useState, type CSSProperties } from "react";
import { apiFetch } from "../api";

type Row = {
  id: number;
  event_title: string;
  full_name: string;
  username: string;
  organizer_confirmed: boolean;
  visits_count: number;
  checked_in_at: string | null;
};

export default function CheckinsLite() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Not loaded");
  const [err, setErr] = useState("");

  const loginAndLoad = async () => {
    setErr("");
    setStatus("Logging in...");
    try {
      const loginRes = await apiFetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        setErr(loginData.message || "Login failed");
        setStatus("Failed");
        return;
      }
      setStatus("Loading checkins...");
      const q = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
      const res = await apiFetch(`/api/admin/checkins/${q}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || data.message || "API error");
        setStatus("Failed");
        return;
      }
      setRows(data.results || []);
      setStatus(`Loaded rows: ${(data.results || []).length}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setStatus("Failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Checkins Lite</h1>
      <p style={{ marginTop: 6, color: "#555" }}>Simple fallback page (no animations/layout).</p>

      <div style={{ marginTop: 16, display: "grid", gap: 10, maxWidth: 420 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" style={inp} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" style={inp} />
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="event id (optional)" style={inp} />
        <button onClick={loginAndLoad} style={btn}>Login + Load</button>
      </div>

      <div style={{ marginTop: 16, fontWeight: 600 }}>{status}</div>
      {err && <pre style={{ marginTop: 10, padding: 10, background: "#fee", border: "1px solid #f99" }}>{err}</pre>}

      <table style={{ marginTop: 16, width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Event</th>
            <th style={th}>User</th>
            <th style={th}>Confirmed</th>
            <th style={th}>Visits</th>
            <th style={th}>Last check-in</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.event_title}</td>
              <td style={td}>{r.full_name || r.username}</td>
              <td style={td}>{r.organizer_confirmed ? "yes" : "no"}</td>
              <td style={td}>{r.visits_count}</td>
              <td style={td}>{r.checked_in_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inp: CSSProperties = { border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px" };
const btn: CSSProperties = { border: "none", borderRadius: 8, padding: "10px 12px", background: "#ec4899", color: "#fff", fontWeight: 600, cursor: "pointer" };
const th: CSSProperties = { borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8, fontSize: 14 };

