from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio, random, time, json, os
from ai_engine import analyze_incident

load_dotenv()
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SERVICES = ["api-gateway", "payment-svc", "auth-service", "db-replica", "checkout-flow"]

incidents = []

def generate_metrics():
    metrics = {}
    for svc in SERVICES:
        cpu = random.uniform(20, 95)
        memory = random.uniform(30, 90)
        latency = random.uniform(20, 600)
        error_rate = random.uniform(0, 10)
        metrics[svc] = {
            "cpu": round(cpu, 1),
            "memory": round(memory, 1),
            "latency": round(latency, 1),
            "error_rate": round(error_rate, 2),
            "status": "critical" if cpu > 85 or error_rate > 5 or latency > 500
                      else "warning" if cpu > 70 or error_rate > 2
                      else "healthy"
        }
    return metrics

def detect_anomalies(metrics):
    alerts = []
    for svc, m in metrics.items():
        if m["cpu"] > 85:
            alerts.append({"service": svc, "type": "CPU Spike", "value": m["cpu"], "unit": "%", "severity": "critical"})
        if m["error_rate"] > 5:
            alerts.append({"service": svc, "type": "High Error Rate", "value": m["error_rate"], "unit": "%", "severity": "critical"})
        if m["latency"] > 500:
            alerts.append({"service": svc, "type": "High Latency", "value": m["latency"], "unit": "ms", "severity": "warning"})
    return alerts

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            metrics = generate_metrics()
            alerts = detect_anomalies(metrics)
            if alerts:
                incident = {
                    "id": int(time.time()),
                    "time": time.strftime("%H:%M:%S"),
                    "alerts": alerts,
                    "status": "open"
                }
                incidents.insert(0, incident)
                if len(incidents) > 20:
                    incidents.pop()
            await ws.send_text(json.dumps({
                "metrics": metrics,
                "alerts": alerts,
                "incidents": incidents[:5]
            }))
            await asyncio.sleep(4)
    except:
        pass

@app.post("/api/analyze")
async def analyze(data: dict):
    result = await analyze_incident(data)
    return result

@app.get("/api/incidents")
def get_incidents():
    return incidents