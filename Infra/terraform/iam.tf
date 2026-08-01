data "aws_caller_identity" "current" {}

# --- Execution role: what ECS itself needs (pull image, write logs, read secrets) ---

resource "aws_iam_role" "ecs_execution" {
  name = "escra-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "escra-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = concat(
        [for s in aws_secretsmanager_secret.app : s.arn],
        [aws_secretsmanager_secret.database_url.arn, aws_secretsmanager_secret.redis_url.arn],
      )
    }]
  })
}

# --- Task role: what the application code itself is allowed to do at runtime ---

resource "aws_iam_role" "ecs_task" {
  name = "escra-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}
