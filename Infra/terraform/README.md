# Terraform — AWS deployment

Deploys ESCRA onto AWS Fargate: VPC (public + private subnets across 2 AZs,
NAT gateways), an ALB routing `web` at `<domain>` and `api` at
`api.<domain>` by host header, ECS Fargate services for `Backend` and
`Frontend`, RDS Postgres, ElastiCache Redis, ECR repositories, and the
Secrets Manager entries + IAM roles the ECS tasks need to read them.

This is a starting point, not a finished production setup — see
"Not yet handled" below before pointing it at a real account.

## Usage

```bash
cd Infra/terraform
terraform init
terraform plan -var="domain_name=escra.yourdomain.com" -var="certificate_arn=arn:aws:acm:..."
terraform apply
```

Without `certificate_arn`, the ALB serves plain HTTP with host-based
routing — fine for a first smoke test, not for anything real. Request an
ACM certificate for `yourdomain.com` and `api.yourdomain.com` (or a
wildcard) first.

After `apply`, point your DNS at the `alb_dns_name` output:
- `yourdomain.com` → ALB (web)
- `api.yourdomain.com` → ALB (api)

### Pushing images

`aws_ecs_task_definition` references `<ecr_repo>:<var.api_image_tag>` /
`:<var.web_image_tag>` (defaulting to `latest`). Build and push from repo
root using the existing `Backend/Dockerfile` / `Frontend/Dockerfile`
(the same ones `docker-compose.yml` and CI already use):

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -f Backend/Dockerfile -t <ecr_api_repository_url>:<tag> .
docker push <ecr_api_repository_url>:<tag>

docker build -f Frontend/Dockerfile -t <ecr_web_repository_url>:<tag> .
docker push <ecr_web_repository_url>:<tag>

terraform apply -var="api_image_tag=<tag>" -var="web_image_tag=<tag>"
```

### Remote state

State is local by default. Uncomment the `backend "s3"` block in
`versions.tf` once an S3 bucket + DynamoDB lock table exist, then
`terraform init -migrate-state`.

## Not yet handled

- **Secret values**: Terraform creates the Secrets Manager entries for JWT/
  session/webhook secrets (`aws_secretsmanager_secret.app`) but doesn't
  populate them — `DATABASE_URL` and `REDIS_URL` are derived and written
  automatically, but the four app secrets need a value set out-of-band
  (`aws secretsmanager put-secret-value`) before the api task can boot
  cleanly, per `Backend/src/config/env.validation.ts`'s required fields.
- **CI/CD**: nothing here builds/pushes images or runs `terraform apply`
  automatically. `.github/workflows/ci.yml` (which must stay at that path —
  GitHub only reads workflows from `.github/workflows/`) currently builds
  and validates images but doesn't deploy; wiring that up is a follow-on.
- **DNS**: no `aws_route53_zone`/`aws_route53_record` — this assumes the
  domain is managed elsewhere and you'll point it at `alb_dns_name`
  manually.
- **Autoscaling**: `desired_count` is fixed via variables; no
  `aws_appautoscaling_target`/`policy` yet.
