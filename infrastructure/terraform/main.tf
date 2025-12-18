# =============================================================================
# Machinery Rentals - Production Infrastructure
# =============================================================================
# Provider: AWS (can be adapted for GCP/Azure)
# Components: VPC, ECS Fargate, RDS PostgreSQL, ALB, ECR
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Remote state storage (uncomment for production)
  # backend "s3" {
  #   bucket         = "machinery-rentals-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "ap-southeast-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "machinery-rentals"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# Local Values
# =============================================================================

locals {
  name_prefix = "machinery-rentals-${var.environment}"
  
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  common_tags = {
    Project     = "machinery-rentals"
    Environment = var.environment
  }
}
