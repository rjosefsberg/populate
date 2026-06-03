output "public_ip" {
  description = "Public IP address of the Populate instance"
  value       = aws_eip.populate.public_ip
}

output "url" {
  description = "URL to open the app"
  value       = "http://${aws_eip.populate.public_ip}"
}
