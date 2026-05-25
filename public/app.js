const fields = ["timestamp", "uptime", "hostname", "podName", "visitorCount", "nodeVersion"];

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function renderEnvironment(environment) {
  const target = document.getElementById("environment");
  if (!target || !environment) return;

  target.replaceChildren(...Object.entries(environment).map(([key, value]) => {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const data = document.createElement("strong");

    row.className = "env-row";
    label.textContent = key;
    data.textContent = value;

    row.append(label, data);
    return row;
  }));
}

async function refreshInfo() {
  const state = document.getElementById("refreshState");

  try {
    const response = await fetch("/api/info", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const info = await response.json();
    fields.forEach((field) => setText(field, info[field]));
    renderEnvironment(info.environment);
    if (state) state.textContent = "Updated just now";
  } catch (error) {
    if (state) state.textContent = "Refresh paused";
  }
}

setInterval(refreshInfo, 5000);
