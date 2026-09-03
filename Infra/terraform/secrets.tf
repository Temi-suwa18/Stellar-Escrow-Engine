# Secrets the api task needs at runtime. Values are written here as
# placeholders and expected to be filled in out-of-band (console, CLI, or a
# separate secrets-rotation pipeline) — Terraform manages the secret's
# existence and the ECS task's permission to read it, not its contents.
locals {
  app_secret_names = [
    "jwt-access-secret",
    "jwt-refresh-secret",
    "session-secret",
    "webhook-signing-secret",
  ]
}

resource "aws_secretsmanager_secret" "app" {
  for_each = toset(local.app_secret_names)
  name     = "escra/${var.environment}/${each.value}"
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "escra/${var.environment}/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}?schema=public"
}

resource "aws_secretsmanager_secret" "redis_url" {
  name = "escra/${var.environment}/redis-url"
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id     = aws_secretsmanager_secret.redis_url.id
  secret_string = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
}
