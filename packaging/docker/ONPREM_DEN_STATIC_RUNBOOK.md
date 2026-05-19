# On-prem Den static worker runbook

This runbook launches an enterprise/LAN deployment where Den is the control plane and one or more pre-running OpenWork Host containers are the real worker runtimes. Den does not create containers in `static` mode; it assigns each shared/cloud worker request to a healthy URL from `DEN_STATIC_WORKER_URLS`.

Use `static-worker-smoke` only for Den provisioner health checks. It is a tiny `/health` HTTP service, not an OpenWork runtime, and it cannot run workspaces or sessions.

## Components and ports

- Den API/control plane: `http://<den-host>:8788`
- Den web UI: `http://<den-host>:3005`
- Real OpenWork worker: `http://<worker-host>:8787`
- Optional smoke-only worker: `http://<den-host>:8787` or `http://static-worker-smoke:8787` from inside Docker

The production worker image is built from `packaging/docker/Dockerfile` and defaults to `openwork-orchestrator@0.13.8`, matching `apps/orchestrator/package.json`. Override it with `OPENWORK_ORCHESTRATOR_VERSION=<version>` when rebuilding if an enterprise deployment pins another released orchestrator package.

## Prerequisites

- Docker Engine with Compose v2.
- LAN routing/firewall rules allowing Den to reach each worker on port `8787` and browsers to reach Den web on port `3005`.
- A workspace directory per worker, mounted at `/workspace` inside the worker container.
- Stable bearer tokens set with `OPENWORK_TOKEN` and `OPENWORK_HOST_TOKEN`; do not commit real tokens.

All commands below assume the repo root is `D:\openwork` on Windows or the OpenWork repo root on Linux/macOS.

## 1. Start one real OpenWork worker

PowerShell:

```powershell
Set-Location D:\openwork\packaging\docker
$env:OPENWORK_ORCHESTRATOR_VERSION = "0.13.8"
$env:OPENWORK_HOST_PORT = "8787"
$env:OPENWORK_CONNECT_HOST = "192.168.1.50"
$env:OPENWORK_WORKSPACE_DIR = "./workspace-worker-1"
$env:OPENWORK_DATA_DIR_HOST = "./data-worker-1"
$env:OPENWORK_TOKEN = "replace-with-client-token"
$env:OPENWORK_HOST_TOKEN = "replace-with-host-token"
docker compose -p openwork-worker-1 up --build -d
docker compose -p openwork-worker-1 ps
curl.exe http://192.168.1.50:8787/health
```

Bash:

```bash
cd /path/to/openwork/packaging/docker
export OPENWORK_ORCHESTRATOR_VERSION=0.13.8
export OPENWORK_HOST_PORT=8787
export OPENWORK_CONNECT_HOST=192.168.1.50
export OPENWORK_WORKSPACE_DIR=./workspace-worker-1
export OPENWORK_DATA_DIR_HOST=./data-worker-1
export OPENWORK_TOKEN=replace-with-client-token
export OPENWORK_HOST_TOKEN=replace-with-host-token
docker compose -p openwork-worker-1 up --build -d
docker compose -p openwork-worker-1 ps
curl http://192.168.1.50:8787/health
```

Expected health result: HTTP 200 JSON from the OpenWork server. This is the URL Den should receive for this worker.

## 2. Start multiple real workers

Run each worker with a unique Compose project, host port, workspace/data directory, and LAN URL. Example for two workers on one host:

PowerShell:

```powershell
Set-Location D:\openwork\packaging\docker

$env:OPENWORK_HOST_PORT = "8787"
$env:OPENWORK_CONNECT_HOST = "192.168.1.50"
$env:OPENWORK_WORKSPACE_DIR = "./workspace-worker-1"
$env:OPENWORK_DATA_DIR_HOST = "./data-worker-1"
docker compose -p openwork-worker-1 up --build -d

$env:OPENWORK_HOST_PORT = "8788"
$env:OPENWORK_CONNECT_HOST = "192.168.1.50"
$env:OPENWORK_WORKSPACE_DIR = "./workspace-worker-2"
$env:OPENWORK_DATA_DIR_HOST = "./data-worker-2"
docker compose -p openwork-worker-2 up --build -d

curl.exe http://192.168.1.50:8787/health
curl.exe http://192.168.1.50:8788/health
```

Bash:

```bash
cd /path/to/openwork/packaging/docker

OPENWORK_HOST_PORT=8787 OPENWORK_CONNECT_HOST=192.168.1.50 \
OPENWORK_WORKSPACE_DIR=./workspace-worker-1 OPENWORK_DATA_DIR_HOST=./data-worker-1 \
  docker compose -p openwork-worker-1 up --build -d

OPENWORK_HOST_PORT=8788 OPENWORK_CONNECT_HOST=192.168.1.50 \
OPENWORK_WORKSPACE_DIR=./workspace-worker-2 OPENWORK_DATA_DIR_HOST=./data-worker-2 \
  docker compose -p openwork-worker-2 up --build -d

curl http://192.168.1.50:8787/health
curl http://192.168.1.50:8788/health
```

For separate physical/VM hosts, keep the container port at `8787` on each host and use each host's LAN IP in Den, for example `http://192.168.1.50:8787,http://192.168.1.51:8787`.

## 3. Start Den in static mode against real workers

PowerShell:

```powershell
Set-Location D:\openwork
$env:DEN_PROVISIONER_MODE = "static"
$env:DEN_STATIC_WORKER_URLS = "http://192.168.1.50:8787,http://192.168.1.51:8787"
$env:DEN_STATIC_WORKER_HEALTH_PATH = "/health"
$env:DEN_STATIC_WORKER_HEALTHCHECK_TIMEOUT_MS = "10000"
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml up --build -d
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml ps
curl.exe http://127.0.0.1:8788/health
curl.exe http://127.0.0.1:3005/api/den/health
```

Bash:

```bash
cd /path/to/openwork
export DEN_PROVISIONER_MODE=static
export DEN_STATIC_WORKER_URLS=http://192.168.1.50:8787,http://192.168.1.51:8787
export DEN_STATIC_WORKER_HEALTH_PATH=/health
export DEN_STATIC_WORKER_HEALTHCHECK_TIMEOUT_MS=10000
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml up --build -d
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml ps
curl http://127.0.0.1:8788/health
curl http://127.0.0.1:3005/api/den/health
```

`DEN_STATIC_WORKER_URLS` is comma-separated. Den trims trailing slashes, probes each URL's configured health path, and assigns one not-already-active static URL per worker request.

## 4. Validate Den UI behavior and add a shared workspace

1. Open `http://<den-host>:3005`.
2. Sign in or use the local demo org if seeded.
3. Create or open an organization/team workspace area.
4. Add a shared/cloud worker from the Den UI.
5. Expected behavior:
   - The worker briefly appears as `provisioning`/`Starting`.
   - Den calls `/health` on the first unassigned URL from `DEN_STATIC_WORKER_URLS`.
   - The worker becomes `healthy` and its instance/provider metadata shows `static`.
   - Adding another shared worker consumes the next URL in `DEN_STATIC_WORKER_URLS`.
   - If every static URL is already assigned to an active worker, the new request fails with a clear "No available static worker URL remains" error.

If the UI exposes `Add worker` -> `Connect remote`, use the URL + token from the healthy OpenWork worker. The base user contract remains URL + token; billing gates are not required for base on-prem static worker attachment.

## 5. Smoke simulation only

Use this only to validate Den static provisioning without a real OpenWork runtime:

PowerShell:

```powershell
Set-Location D:\openwork
$env:DEN_PROVISIONER_MODE = "static"
$env:DEN_STATIC_WORKER_URLS = "http://static-worker-smoke:8787"
docker compose --profile static-worker-smoke -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml up --build -d
curl.exe http://127.0.0.1:8787/health
```

Bash:

```bash
cd /path/to/openwork
DEN_PROVISIONER_MODE=static DEN_STATIC_WORKER_URLS=http://static-worker-smoke:8787 \
  docker compose --profile static-worker-smoke -p openwork-den-static \
  -f packaging/docker/docker-compose.den-dev.yml up --build -d
curl http://127.0.0.1:8787/health
```

Do not use `static-worker-smoke` for production or workspace/session validation.

## 6. Compose validation before launch

PowerShell:

```powershell
Set-Location D:\openwork
$env:DEN_PROVISIONER_MODE = "static"
$env:DEN_STATIC_WORKER_URLS = "http://192.168.1.50:8787,http://192.168.1.51:8787"
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config

Set-Location D:\openwork\packaging\docker
$env:OPENWORK_ORCHESTRATOR_VERSION = "0.13.8"
$env:OPENWORK_HOST_PORT = "8787"
docker compose -p openwork-worker-1 config
```

Bash:

```bash
cd /path/to/openwork
DEN_PROVISIONER_MODE=static \
DEN_STATIC_WORKER_URLS=http://192.168.1.50:8787,http://192.168.1.51:8787 \
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml config

cd packaging/docker
OPENWORK_ORCHESTRATOR_VERSION=0.13.8 OPENWORK_HOST_PORT=8787 \
docker compose -p openwork-worker-1 config
```

In rendered output, confirm Den has `PROVISIONER_MODE: static` and `STATIC_WORKER_URLS` set to the real LAN worker URLs, and the worker build arg is the expected orchestrator version.

## 7. Restart, stop, and logs

Restart Den:

```bash
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml restart den web
```

Restart a worker:

```bash
cd packaging/docker
docker compose -p openwork-worker-1 restart openwork-host
```

Follow logs:

```bash
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml logs -f den web
docker compose -p openwork-worker-1 logs -f openwork-host
```

Stop without deleting volumes:

```bash
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml down
cd packaging/docker && docker compose -p openwork-worker-1 down
```

Reset Den dev database volumes only when intentional:

```bash
docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml down -v
```

## 8. Troubleshooting

- Worker remains `Starting`: from the Den host, run `curl http://<worker-host>:8787/health`. Fix routing, firewall, or the worker container before retrying.
- Worker becomes `failed`: inspect Den logs with `docker compose -p openwork-den-static -f packaging/docker/docker-compose.den-dev.yml logs den` and confirm `DEN_STATIC_WORKER_URLS` is non-empty and points to real workers.
- No static worker available: add another URL to `DEN_STATIC_WORKER_URLS`, remove stale active worker records through supported admin flows, or stop requesting additional shared workers.
- Browser auth/cors problems: set `DEN_PUBLIC_HOST`, `DEN_BETTER_AUTH_URL`, `DEN_BETTER_AUTH_TRUSTED_ORIGINS`, and `DEN_CORS_ORIGINS` to the LAN Den web/API origins before starting Den.
- Wrong connect host in printed worker URLs: set `OPENWORK_CONNECT_HOST` to the worker LAN IP/DNS and recreate the worker container.
- Version mismatch: rebuild the worker with `OPENWORK_ORCHESTRATOR_VERSION` matching the released orchestrator package you intend to support.
