resource "aws_db_subnet_group" "main" {
  name       = "escra-db-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "escra-db-subnets" }
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_instance" "postgres" {
  identifier     = "escra-postgres"
  engine         = "postgres"
  engine_version = "16"

  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp3"
  storage_encrypted      = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  multi_az                  = var.environment == "production"
  backup_retention_period   = 7
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "escra-postgres-final" : null

  tags = { Name = "escra-postgres" }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "escra-redis-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id         = "escra-redis"
  engine             = "redis"
  engine_version     = "7.1"
  node_type          = var.redis_node_type
  num_cache_nodes    = 1
  port               = 6379
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  apply_immediately  = var.environment != "production"

  tags = { Name = "escra-redis" }
}
