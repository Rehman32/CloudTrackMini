# CloudTrack Mini

Lightweight Node.js + Express dashboard for **Docker** and **Kubernetes** on AWS Free Tier (t2.micro). Server-rendered HTML, minimal dependencies, and low memory footprint.

## Features

| Route | Description |
|-------|-------------|
| `GET /` | Responsive dashboard (timestamp, uptime, hostname/pod, visitor counter, env info) |
| `GET /api/info` | JSON: timestamp, hostname, uptime, node version, visitor count |
| `GET /health` | `{ "status": "ok" }` for probes |

## Project structure

```
.
├── server.js
├── package.json
├── public/css/style.css
├── Dockerfile
├── k8s/
│   ├── deployment.yaml   # 2 replicas, memory limits
│   └── service.yaml      # NodePort 30080
└── README.md
```

## Requirements

- Node.js 20+
- Docker (optional)
- kubectl + cluster (optional)

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | `production` in Docker/K8s |
| `APP_NAME` | `CloudTrack Mini` | Title on dashboard |
| `HOSTNAME` | OS hostname | In Kubernetes, set to **pod name** automatically |

## Local run

```bash
cd Cloud_project
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Development with auto-restart (Node 20+):

```bash
npm run dev
```

Custom port:

```bash
# PowerShell
$env:PORT=8080; npm start

# Bash
PORT=8080 npm start
```

## Docker

Build:

```bash
docker build -t cloudtrack-mini:latest .
```

Run:

```bash
docker run --rm -p 3000:3000 -e NODE_ENV=production cloudtrack-mini:latest
```

Health check:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/info
```

## Kubernetes

Build and load image on your cluster node (example for local/minikube):

```bash
docker build -t cloudtrack-mini:latest .
# minikube: minikube image load cloudtrack-mini:latest
# kind: kind load docker-image cloudtrack-mini:latest
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Verify:

```bash
kubectl get pods -l app=cloudtrack-mini
kubectl get svc cloudtrack-mini
```

Access via **NodePort** (default `30080` on any node IP):

```text
http://<node-ip>:30080/
```

On minikube:

```bash
minikube service cloudtrack-mini --url
```

Scale or tune resources in `k8s/deployment.yaml` (`replicas`, `resources.requests/limits`).

## AWS Free Tier notes

- Use **t2.micro** or **t3.micro** with swap if needed; keep pod memory limits at **128Mi** or lower per replica.
- Two replicas fit a small cluster; reduce to `replicas: 1` if the node is memory-constrained.
- Push the image to **ECR** and set `image:` in `deployment.yaml` for production pulls.

## License

MIT
