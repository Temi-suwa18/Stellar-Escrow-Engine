variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. staging, production)."
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "AZs to spread subnets across. Two is the minimum for an ALB + RDS Multi-AZ."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "api_image_tag" {
  description = "Image tag to deploy for the Backend (api) service, e.g. a commit SHA."
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Image tag to deploy for the Frontend (web) service, e.g. a commit SHA."
  type        = string
  default     = "latest"
}

variable "api_cpu" {
  description = "Fargate task CPU units for the api service (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate task memory (MiB) for the api service."
  type        = number
  default     = 1024
}

variable "web_cpu" {
  description = "Fargate task CPU units for the web service."
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Fargate task memory (MiB) for the web service."
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Number of api tasks to run."
  type        = number
  default     = 2
}

variable "web_desired_count" {
  description = "Number of web tasks to run."
  type        = number
  default     = 2
}

variable "api_min_capacity" {
  description = "Floor for api service autoscaling. Should be >= 2 in production for zero-downtime deploys."
  type        = number
  default     = 2
}

variable "api_max_capacity" {
  description = "Ceiling for api service autoscaling."
  type        = number
  default     = 10
}

variable "web_min_capacity" {
  description = "Floor for web service autoscaling."
  type        = number
  default     = 2
}

variable "web_max_capacity" {
  description = "Ceiling for web service autoscaling."
  type        = number
  default     = 10
}

variable "autoscaling_target_cpu_percent" {
  description = "Target average CPU utilization the autoscaler tries to maintain for both services."
  type        = number
  default     = 60
}

variable "db_instance_class" {
  description = "RDS instance class for Postgres."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Postgres database name."
  type        = string
  default     = "stellar_escrow"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "stellar"
}

variable "redis_node_type" {
  description = "ElastiCache node type for Redis."
  type        = string
  default     = "cache.t4g.micro"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the ALB's HTTPS listener. Leave empty to run HTTP-only (not recommended beyond a first smoke test)."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Root domain the app is served from, e.g. \"escra.app\". The web service is routed at this host, the api service at \"api.<domain_name>\". Only used for ALB host-based routing rules — Route53/DNS records are out of scope here."
  type        = string
  default     = "escra.example.com"
}
