terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment once a bucket/table exist for this project, then `terraform init -migrate-state`.
  # backend "s3" {
  #   bucket         = "escra-terraform-state"
  #   key            = "escra/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "escra-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "escra"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
