import { useEffect, useState } from "react";
import "./App.css";

// Sprint 0: prove the frontend can reach backend services.
// Sprint 4+ will replace this with real dashboard widgets and live WebSocket data.
const SERVICES = [
  { name: "auth-service", url: "http://localhost:4001/health" },
  { name: "ingestion-service", url: "http://localhost:4002/health" },
  { name: "ws-gateway", url: "http://localhost:4003/health" },
];

function App() {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    SERVICES.forEach(({ name, url }) => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => setStatuses((prev) => ({ ...prev, [name]: data })))
        .catch(() => setStatuses((prev) => ({ ...prev, [name]: { status: "unreachable" } })));
    });
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>PulseBoard — Sprint 0 Skeleton</h1>
      <p>Service health check (proves the Compose stack is wired correctly):</p>
      <ul>
        {SERVICES.map(({ name }) => (
          <li key={name}>
            <strong>{name}:</strong>{" "}
            {statuses[name] ? statuses[name].status : "checking..."}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
