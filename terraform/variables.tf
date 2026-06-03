variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "anthropic_api_key" {
  description = "Anthropic API key passed to the container"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Flask session secret key"
  type        = string
  sensitive   = true
}

variable "app_password" {
  description = "Login password for the app (leave empty to use admin:admin default)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "image" {
  description = "Docker image to run"
  type        = string
  default     = "ghcr.io/<your-github-username>/populate:latest"
}
