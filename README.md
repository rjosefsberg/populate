# Populate

## About
A fantasy world-building tool. Create characters, places, and items — the app uses the Anthropic Claude API to generate rich descriptions for each one, and lets you link them together with typed associations.

## Why
Hello! If you're reading this you might be looking for some extremely niche creativity tools for tabletop roleplaying game, or you might be considering me
for a job. Either way, glad you're here. I'm going to talk assuming you understand what Dungeons and Dragons is.

I've had this tool kicking around in my head since the generative AI boom. I would often find myself in need of a random 
story bit for a game and really did not need to put an immense amount of thought into the fine details. However, once something is "on screen" its forever ,
and players rarely forget. So, I wanted something light and fast that could:

1) Create the type of thing I need (person, place, thing).
2) Let me clean it up and refine it. 
3) Let me associate it with other things in the future, so I can keep track. 


It started as a Spring Boot project using the templating and front end tech I was used to. I immediately lost interest in it because I was using the
same stack for work. 

Recently, I came upon a fair amount of free time, so I decided to start fresh with a modern stack and a more modern UI. Most importantly, I wanted
to see how powerful Claude Code was. Most jobs on the market right now expect this type of tool to be fully integrated into your workflow. So, I decided to
build it end to end with Claude Code to see how easy it would be and how reliable it was. I will be completely honest, 
I have not read every single line of every single test in this project. If you want to open an accusatory merge request, go for it. 
I have, however, spent time on the important bits, like sanitizing user input and making sure the app is secure. 
Learning more about the deployment technologies was also interesting. I did not go as far as actually deploying the app,
but I did set up a CI pipeline to build and push a Docker image to GitHub Container Registry. 

My thoughts. These tools are exceptionally powerful, but also extremely naive. It needs reminders not to overengineer. 
I can say pretty confidently that these tools will be part of our job from here on. I just hope we, as an industry, can
mature fast enough to understand their limitations. 


## What it does

- **Generate entities** — give a name, pick a genre (Fantasy, Sci-Fi, Horror, Western, Historical, Noir, Post-Apocalyptic) and type (person, place, thing), and Claude writes a three-sentence description
- **Associations** — link any two entities with a description; associations can optionally be included in the generation prompt so they're woven into the generated text
- **Edit** — titles, descriptions, and associations are all editable after creation
- **Usage tracker** — a sidebar button shows session token usage and confirms your API key is active

---

## Prerequisites

- Python 3.13+
- Node 20+
- An [Anthropic API key](https://console.anthropic.com/)

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
        │     ├── entity_service.py   (CRUD + Anthropic generation)
        │     ├── association_service.py
        │     └── usage_service.py    (in-memory token tracking)
        └── /*             → React build (static files)

Storage: SQLite (default) or PostgreSQL (set DATABASE_URL)
```

**Key files:**

| Path | Purpose |
|---|---|
| `app/routes.py` | HTTP handlers |
| `app/auth.py` | Session-based auth, `@require_auth` decorator |
| `app/services/entity_service.py` | Generation prompt builder + Anthropic API call |
| `app/utils/sanitize.py` | Input validation and sanitization |
| `frontend/src/api/client.js` | Central fetch wrapper (credentials, 401 handling) |
| `frontend/src/components/AddEntityModal.js` | Create flow with genre, type, associations |
| `frontend/src/components/EditEntityForm.jsx` | Edit flow with inline association management |
