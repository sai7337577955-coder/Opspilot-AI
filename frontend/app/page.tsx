"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertTriangle, CheckCircle, Zap, Server, Brain } from "lucide-react";

const SERVICES = ["api-gateway", "payment-svc", "auth-service", "db-replica", "checkout-flow"];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>({});
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [rca, setRca] = useState<string>("");
  const [rcaLoading, setRcaLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("wss://opspilot-ai-production-2c74.up.railway.app/ws");
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMetrics(data.metrics);
      setAlerts(data.alerts);
      setIncidents(data.incidents);
      setHistory(h => [...h.slice(-20), { time: new Date().toLocaleTimeString(), ...data.metrics["api-gateway"] }]);
    };
    return () => ws.close();
  }, []);

  const runRCA = async (incident: any) => {
    setRcaLoading(true);
    setRca("");
    const res = await fetch("https://opspilot-ai-production-2c74.up.railway.app/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident),
    });
    const data = await res.json();
    setRca(data.analysis);
    setRcaLoading(false);
  };

  return (
    <div style={{ background: "#020817", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Space Grotesk, sans-serif", padding: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>OpsPilot <span style={{ color: "#4f8cff" }}>AI</span></h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>AI-Powered Operations Copilot</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f172a", padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(79,140,255,.2)" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
          <span style={{ fontSize: "13px", color: connected ? "#22c55e" : "#ef4444" }}>{connected ? "Live" : "Disconnected"}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Services", value: SERVICES.length, icon: <Server size={18} />, color: "#4f8cff" },
          { label: "Active Alerts", value: alerts.length, icon: <AlertTriangle size={18} />, color: alerts.length > 0 ? "#f87171" : "#22c55e" },
          { label: "Incidents", value: incidents.length, icon: <Activity size={18} />, color: "#f59e0b" },
          { label: "Healthy", value: Object.values(metrics).filter((m: any) => m?.status === "healthy").length, icon: <CheckCircle size={18} />, color: "#22c55e" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.06)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#64748b", fontSize: "13px" }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        
        {/* Service Health Grid */}
        <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.06)", borderRadius: "12px", padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#fff" }}>Service Health</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {SERVICES.map(svc => {
              const m = metrics[svc];
              const color = m?.status === "critical" ? "#f87171" : m?.status === "warning" ? "#f59e0b" : "#22c55e";
              return (
                <div key={svc} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#020817", borderRadius: "8px", border: `1px solid ${color}22` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{svc}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                    <span>CPU <b style={{ color: m?.cpu > 85 ? "#f87171" : "#e2e8f0" }}>{m?.cpu}%</b></span>
                    <span>MEM <b style={{ color: "#e2e8f0" }}>{m?.memory}%</b></span>
                    <span>LAT <b style={{ color: m?.latency > 500 ? "#f87171" : "#e2e8f0" }}>{m?.latency}ms</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Chart */}
        <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.06)", borderRadius: "12px", padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#fff" }}>API Gateway — Live Metrics</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#475569" }} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="cpu" stroke="#4f8cff" dot={false} name="CPU %" strokeWidth={2} />
              <Line type="monotone" dataKey="latency" stroke="#f59e0b" dot={false} name="Latency ms" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Incidents */}
        <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.06)", borderRadius: "12px", padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#fff" }}>Recent Incidents</h2>
          {incidents.length === 0 ? (
            <p style={{ color: "#475569", fontSize: "14px" }}>No incidents detected</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {incidents.map((inc, i) => (
                <div key={i} style={{ padding: "14px", background: "#020817", borderRadius: "8px", border: "1px solid rgba(248,113,113,.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}>INCIDENT #{inc.id?.toString().slice(-4)}</span>
                    <span style={{ fontSize: "11px", color: "#475569" }}>{inc.time}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "10px" }}>
                    {inc.alerts?.slice(0,2).map((a: any, j: number) => (
                      <div key={j}>⚠ {a.service} — {a.type}: {a.value}{a.unit}</div>
                    ))}
                  </div>
                  <button onClick={() => runRCA(inc)} style={{ background: "#1e3a5f", color: "#4f8cff", border: "1px solid rgba(79,140,255,.3)", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Brain size={13} /> Run AI Analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RCA Panel */}
        <div style={{ background: "#0f172a", border: "1px solid rgba(79,140,255,.2)", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Zap size={18} color="#4f8cff" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>AI Root Cause Analysis</h2>
          </div>
          {rcaLoading && (
            <div style={{ color: "#4f8cff", fontSize: "14px" }}>🧠 Analyzing incident with Claude AI...</div>
          )}
          {rca && !rcaLoading && (
            <div style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{rca}</div>
          )}
          {!rca && !rcaLoading && (
            <p style={{ color: "#475569", fontSize: "14px" }}>Click "Run AI Analysis" on any incident to get Claude-powered root cause analysis and remediation steps.</p>
          )}
        </div>
      </div>
    </div>
  );
}