#!/bin/bash
set -e

# Install Docker
dnf install -y docker
systemctl enable docker
systemctl start docker

# Create data directory for SQLite persistence
mkdir -p /opt/populate/data

# Pull and run the app
docker run -d \
  --name populate \
  --restart unless-stopped \
  -p 80:5000 \
  -v /opt/populate/data:/data \
  -e ANTHROPIC_API_KEY="${anthropic_api_key}" \
  -e SECRET_KEY="${secret_key}" \
  -e APP_PASSWORD="${app_password}" \
  ${image}
