# Production Infrastructure

Terraform configuration for deploying Machinery Rentals to AWS.

## Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                         VPC                              │
                    │  ┌─────────────────────────────────────────────────────┐ │
                    │  │              Public Subnets (3 AZs)                 │ │
Internet ──────────►│  │  ┌─────────────────────────────────────────────┐   │ │
                    │  │  │     Application Load Balancer (ALB)         │   │ │
                    │  │  │         HTTP/HTTPS → Port 3000              │   │ │
                    │  │  └─────────────────────────────────────────────┘   │ │
                    │  │                        │                            │ │
                    │  │                   NAT Gateway                       │ │
                    │  └────────────────────────┼────────────────────────────┘ │
                    │                           │                              │
                    │  ┌────────────────────────┼────────────────────────────┐ │
                    │  │              Private Subnets (3 AZs)                │ │
                    │  │                        ▼                            │ │
                    │  │  ┌─────────────────────────────────────────────┐   │ │
                    │  │  │           ECS Fargate Cluster               │   │ │
                    │  │  │    ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │ │
                    │  │  │    │  Task   │  │  Task   │  │  Task   │   │   │ │
                    │  │  │    │  (App)  │  │  (App)  │  │  (App)  │   │   │ │
                    │  │  │    └─────────┘  └─────────┘  └─────────┘   │   │ │
                    │  │  │         Auto-scaling: 2-10 instances        │   │ │
                    │  │  └─────────────────────────────────────────────┘   │ │
                    │  └────────────────────────┼────────────────────────────┘ │
                    │                           │                              │
                    │  ┌────────────────────────┼────────────────────────────┐ │
                    │  │             Database Subnets (3 AZs)                │ │
                    │  │                        ▼                            │ │
                    │  │  ┌─────────────────────────────────────────────┐   │ │
                    │  │  │         RDS PostgreSQL (Multi-AZ)           │   │ │
                    │  │  │              db.t3.medium                    │   │ │
                    │  │  │         50-200 GB auto-scaling              │   │ │
                    │  │  └─────────────────────────────────────────────┘   │ │
                    │  └─────────────────────────────────────────────────────┘ │
                    └─────────────────────────────────────────────────────────┘
```

## Components

| Component | Service | Details |
|-----------|---------|---------|
| **Compute** | ECS Fargate | Serverless containers, auto-scaling 2-10 |
| **Database** | RDS PostgreSQL 15 | Multi-AZ, encrypted, auto-scaling storage |
| **Load Balancer** | ALB | HTTPS termination, health checks |
| **Container Registry** | ECR | Private Docker registry |
| **Secrets** | Secrets Manager | Database credentials, API keys |
| **Networking** | VPC | 3 AZs, public/private/database subnets |
| **Monitoring** | CloudWatch | Logs, metrics, Container Insights |

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Docker** for building and pushing images

## Quick Start

```bash
# 1. Navigate to terraform directory
cd infrastructure/terraform

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Initialize Terraform
terraform init

# 4. Review the plan
terraform plan

# 5. Apply infrastructure
terraform apply

# 6. Build and push Docker image
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url)
docker build -t machinery-rentals .
docker tag machinery-rentals:latest $(terraform output -raw ecr_repository_url):latest
docker push $(terraform output -raw ecr_repository_url):latest

# 7. Run database migrations
aws ecs run-task \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --task-definition machinery-rentals-production-app \
  --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -json private_subnet_ids | jq -r '.[0]')],securityGroups=[],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"app","command":["npx","prisma","migrate","deploy"]}]}'
```

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `nextauth_secret` | NextAuth.js secret (generate with `openssl rand -base64 32`) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `ap-southeast-2` | AWS region |
| `environment` | `production` | Environment name |
| `db_instance_class` | `db.t3.medium` | RDS instance size |
| `app_desired_count` | `2` | Initial container count |
| `domain_name` | `""` | Custom domain (requires ACM cert) |

## Estimated Costs (USD/month)

| Component | Estimated Cost |
|-----------|---------------|
| ECS Fargate (2 tasks) | ~$30 |
| RDS db.t3.medium | ~$50 |
| NAT Gateway (3 AZs) | ~$100 |
| ALB | ~$20 |
| ECR | ~$5 |
| **Total** | **~$205/month** |

### Cost Optimization

For non-production environments:

```hcl
single_nat_gateway = true      # Saves ~$65/month
db_multi_az        = false     # Saves ~$25/month
db_instance_class  = "db.t3.micro"  # Saves ~$35/month
```

## Security Features

- **Encryption**: RDS encrypted at rest, HTTPS in transit
- **Network Isolation**: Private subnets for app and database
- **Secrets Management**: AWS Secrets Manager for credentials
- **IAM Roles**: Least-privilege task execution roles
- **Security Groups**: Restrictive ingress/egress rules

## Monitoring

- **CloudWatch Logs**: Application logs retained 30 days
- **Container Insights**: ECS cluster metrics
- **RDS Performance Insights**: Database query analysis
- **ALB Access Logs**: Request logging to S3

## Scaling

Auto-scaling is configured based on:

- **CPU Utilization**: Scale at 70%
- **Memory Utilization**: Scale at 80%
- **Request Count**: Scale at 1000 requests/target

## Disaster Recovery

- **Database Backups**: 7-day retention, point-in-time recovery
- **Multi-AZ**: Database failover in ~60 seconds
- **Final Snapshot**: Created on database deletion

## Destroying Infrastructure

```bash
# Remove deletion protection first
terraform apply -var="deletion_protection=false"

# Destroy all resources
terraform destroy
```

**Warning**: This will delete all data including the database!
