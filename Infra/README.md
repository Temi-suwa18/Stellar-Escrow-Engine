# Infra

```
Infra/
  docker/       docker-compose.yml — full local stack (postgres, redis, api, web)
  terraform/    AWS deployment (VPC, ECS Fargate, RDS, ElastiCache, ALB, ECR) — see Infra/terraform/README.md
```

`Backend/Dockerfile` and `Frontend/Dockerfile` live next to their apps
rather than in here, since that's what gives them the right build context
(each app's own `pnpm`/workspace files) without extra path juggling —
`Infra/docker/docker-compose.yml` and the AWS setup in `Infra/terraform`
both build from them.

GitHub Actions workflows live at `.github/workflows/ci.yml`, not under
`Infra/` — GitHub only ever reads workflows from that exact repo-root path,
so there's nowhere else for them to go. CI currently lints, typechecks,
tests, and builds every workspace, plus a Docker build check for both
`Backend/Dockerfile` and `Frontend/Dockerfile` (see the `docker-build` job).

## Local stack

```bash
docker compose -f Infra/docker/docker-compose.yml up -d postgres redis   # just the datastores, for `pnpm dev`
docker compose -f Infra/docker/docker-compose.yml up --build             # everything, containerized
```

## AWS deployment

See [`terraform/README.md`](./terraform/README.md).
