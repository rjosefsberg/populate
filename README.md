# Populate

## About
A world-building tool. Group your work into projects. Write entities (people, places, things, notes) in a rich-text editor, 
link them together with typed associations, attach files, and use an optional Claude-powered chat panel for help when you want it.

## What it does

- **Projects** — group entities into separate projects; list, create, rename, and delete them from the sidebar
- **Entities** — create people, places, things, and notes, and write their descriptions in a rich-text editor (font, size, color, alignment, tables)
- **Get-help chat** — an optional assistant panel; pick other entities as context and ask Claude for suggestions while you write
- **Associations** — link any two entities with a description of the relationship
- **Attachments** — attach files to an entity, download them, and remove them later
- **Settings** — set or update your Anthropic API key from a panel in the app; the key is masked after entry
- **Usage tracker** — a sidebar button shows session token usage and confirms your API key is active

---

## Prerequisites

- Python 3.13+
- Node 20+
- (Optional, for Get-help) [Anthropic API key](https://console.anthropic.com/)

---

## Local development

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd populate
cp .env.example .env   # then fill in your values
```

`.env` values:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `SECRET_KEY` | Yes | Random string for signing session cookies |
| `DATABASE_URL` | No | Defaults to `sqlite:///populate.db` |
| `APP_PASSWORD` | No | Login password — defaults to `admin:admin` if unset |

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Run database migrations

```bash
flask db upgrade
```

### 4. Start the servers

```bash
# Terminal 1 — Flask API on :5000
python run.py

# Terminal 2 — React dev server on :3000 (proxies API to :5000)
cd frontend
npm install
npm start
```

Open `http://localhost:3000`.

---

## Running with Docker

The Docker image bundles both the Flask API and the compiled React frontend into a single container. SQLite is used by default — data is stored in `/data` inside the container.

```bash
# Build
docker build -t populate .

# Run
docker run -d \
  --name populate \
  -p 5000:5000 \
  -v $(pwd)/data:/data \
  -e ANTHROPIC_API_KEY=your-key \
  -e SECRET_KEY=change-me \
  populate
```

Open `http://localhost:5000`. The `-v` flag mounts a local `./data` directory so the SQLite database persists across container restarts.

---

## Running tests

**Backend (pytest):**
```bash
pytest
```

**Frontend (Jest):**
```bash
cd frontend
npx jest --config jest.config.js --watchAll=false
```

---

## Deploying to AWS

The `terraform/` directory provisions a single EC2 instance that runs the Docker container. The CI pipeline publishes a Docker image to GitHub Container Registry on every push to `master` — the instance pulls from there.

### What gets created

- EC2 `t3.micro` (free tier eligible) running Amazon Linux 2023
- Security group allowing HTTP (80) and SSH (22)
- Elastic IP so the address is stable across reboots
- User-data script that installs Docker and starts the container on first boot

### Step-by-step

**1. Install prerequisites**

- [Terraform](https://developer.hashicorp.com/terraform/install)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials (`aws configure`)

**2. Create an EC2 key pair** (for SSH access if you ever need it)

In the AWS Console → EC2 → Key Pairs → Create. Download the `.pem` file.

**3. Make the image public** (or configure a pull secret)

The CI pushes to `ghcr.io/<your-github-username>/populate:latest`. By default GitHub packages are private. Either:
- Go to your package at `https://github.com/<your-github-username>/populate/pkgs/container/populate` and make it public, **or**
- Add a `GITHUB_TOKEN` to the user-data pull command (more complex — making it public is easier for a personal app)

**4. Deploy**

```bash
cd terraform

terraform init

terraform apply \
  -var="key_name=your-key-pair-name" \
  -var="anthropic_api_key=your-anthropic-key" \
  -var="secret_key=$(openssl rand -hex 32)" \
  -var="app_password=your-chosen-password"
```

Terraform will print the public IP and URL when done. The instance takes ~2 minutes to boot and start the container.

**5. Open the app**

```
http://<public-ip>
```

Log in with `admin` / `admin` (or whatever you set `app_password` to).

### Updating the app

Push to `master` → CI builds and pushes a new image → SSH into the instance and run:

```bash
docker pull ghcr.io/<your-github-username>/populate:latest
docker stop populate && docker rm populate
docker run -d \
  --name populate \
  --restart unless-stopped \
  -p 80:5000 \
  -v /opt/populate/data:/data \
  -e ANTHROPIC_API_KEY=your-key \
  -e SECRET_KEY=your-secret \
  -e APP_PASSWORD=your-password \
  ghcr.io/<your-github-username>/populate:latest
```

### Tearing down

```bash
cd terraform
terraform destroy
```

This removes the instance, security group, and Elastic IP. The SQLite file on the host is not touched.

---

## Architecture

```
browser
  └── Flask (port 5000)
        ├── /api/*         → Python route handlers
        │     ├── project_service.py     (project CRUD)
        │     ├── entity_service.py      (entity CRUD)
        │     ├── association_service.py
        │     ├── attachment_service.py  (file upload/download)
        │     ├── assist_service.py      (Get-help chat, Anthropic API)
        │     ├── settings_service.py    (API key storage)
        │     └── usage_service.py       (in-memory token tracking)
        └── /*             → React build (static files)

Storage: SQLite (default) or PostgreSQL (set DATABASE_URL)
```

**Key files:**

| Path | Purpose |
|---|---|
| `app/routes.py` | HTTP handlers |
| `app/auth.py` | Session-based auth, `@require_auth` decorator |
| `app/services/assist_service.py` | Get-help chat prompt builder + Anthropic API call |
| `app/utils/sanitize.py` | Input validation and sanitization |
| `frontend/src/api/client.js` | Central fetch wrapper (credentials, 401 handling) |
| `frontend/src/components/RichTextEditor.jsx` | Entity description editor |
| `frontend/src/components/AssistChatPanel.jsx` | Get-help chat with entity context picker |
| `frontend/src/components/EditEntityForm.jsx` | Edit flow with associations and attachments |
| `frontend/src/components/SettingsModal.jsx` | API key entry and masking |
