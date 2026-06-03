# Stage 1 — build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2 — Python app
FROM python:3.13-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend-build /app/frontend/build ./frontend/build

# SQLite data lives here — mount a volume to persist it
RUN mkdir -p /data

ENV FLASK_APP=run.py
ENV DATABASE_URL=sqlite:////data/populate.db

EXPOSE 5000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
