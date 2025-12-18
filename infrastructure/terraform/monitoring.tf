# =============================================================================
# CloudWatch Monitoring & Alerting
# =============================================================================

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: Overview
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "API Request Count"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "API Latency (p95)"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "p95"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Error Rate (5xx)"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      },

      # Row 2: ECS Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "ECS CPU Utilization"
          region = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "ECS Memory Utilization"
          region = var.aws_region
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "Running Task Count"
          region = var.aws_region
          metrics = [
            ["ECS/ContainerInsights", "RunningTaskCount", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.app.name]
          ]
          period = 60
          stat   = "Average"
        }
      },

      # Row 3: Database Metrics
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Database Connections"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Database CPU"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Database Free Storage"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.main.identifier]
          ]
          period = 60
          stat   = "Average"
        }
      },

      # Row 4: Application Logs
      {
        type   = "log"
        x      = 0
        y      = 18
        width  = 24
        height = 6
        properties = {
          title  = "Application Errors"
          region = var.aws_region
          query  = "SOURCE '${aws_cloudwatch_log_group.app.name}' | filter @message like /ERROR/ | sort @timestamp desc | limit 50"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# SNS Topic for Alerts
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = {
    Name = "${local.name_prefix}-alerts"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

# High Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 10
  alarm_description   = "Error rate exceeds 10 errors per minute"
  
  metric_name = "HTTPCode_Target_5XX_Count"
  namespace   = "AWS/ApplicationELB"
  period      = 60
  statistic   = "Sum"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-high-error-rate"
    Severity = "critical"
  }
}

# High Latency Alarm
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${local.name_prefix}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 2
  alarm_description   = "API latency p95 exceeds 2 seconds"
  
  metric_name = "TargetResponseTime"
  namespace   = "AWS/ApplicationELB"
  period      = 60
  extended_statistic = "p95"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-high-latency"
    Severity = "warning"
  }
}

# ECS High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  alarm_name          = "${local.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 85
  alarm_description   = "ECS CPU utilization exceeds 85%"
  
  metric_name = "CPUUtilization"
  namespace   = "AWS/ECS"
  period      = 60
  statistic   = "Average"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-ecs-high-cpu"
    Severity = "warning"
  }
}

# ECS High Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_high_memory" {
  alarm_name          = "${local.name_prefix}-ecs-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 85
  alarm_description   = "ECS memory utilization exceeds 85%"
  
  metric_name = "MemoryUtilization"
  namespace   = "AWS/ECS"
  period      = 60
  statistic   = "Average"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-ecs-high-memory"
    Severity = "warning"
  }
}

# Database High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "db_high_cpu" {
  alarm_name          = "${local.name_prefix}-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 80
  alarm_description   = "Database CPU utilization exceeds 80%"
  
  metric_name = "CPUUtilization"
  namespace   = "AWS/RDS"
  period      = 60
  statistic   = "Average"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-db-high-cpu"
    Severity = "warning"
  }
}

# Database Low Storage Alarm
resource "aws_cloudwatch_metric_alarm" "db_low_storage" {
  alarm_name          = "${local.name_prefix}-db-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  threshold           = 5368709120 # 5 GB in bytes
  alarm_description   = "Database free storage below 5 GB"
  
  metric_name = "FreeStorageSpace"
  namespace   = "AWS/RDS"
  period      = 300
  statistic   = "Average"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-db-low-storage"
    Severity = "critical"
  }
}

# Database High Connections Alarm
resource "aws_cloudwatch_metric_alarm" "db_high_connections" {
  alarm_name          = "${local.name_prefix}-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 80
  alarm_description   = "Database connections exceed 80"
  
  metric_name = "DatabaseConnections"
  namespace   = "AWS/RDS"
  period      = 60
  statistic   = "Average"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-db-high-connections"
    Severity = "warning"
  }
}

# Unhealthy Host Alarm
resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "${local.name_prefix}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 0
  alarm_description   = "Unhealthy targets detected in load balancer"
  
  metric_name = "UnHealthyHostCount"
  namespace   = "AWS/ApplicationELB"
  period      = 60
  statistic   = "Average"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-unhealthy-hosts"
    Severity = "critical"
  }
}

# -----------------------------------------------------------------------------
# Log Metric Filters
# -----------------------------------------------------------------------------

# Error log metric filter
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "${local.name_prefix}-error-count"
  pattern        = "{ $.level = \"error\" }"
  log_group_name = aws_cloudwatch_log_group.app.name

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "MachineryRentals"
    value         = "1"
    default_value = "0"
  }
}

# Job failure metric filter
resource "aws_cloudwatch_log_metric_filter" "job_failures" {
  name           = "${local.name_prefix}-job-failures"
  pattern        = "{ $.message = \"Job failed*\" }"
  log_group_name = aws_cloudwatch_log_group.app.name

  metric_transformation {
    name          = "JobFailureCount"
    namespace     = "MachineryRentals"
    value         = "1"
    default_value = "0"
  }
}

# Slow request metric filter
resource "aws_cloudwatch_log_metric_filter" "slow_requests" {
  name           = "${local.name_prefix}-slow-requests"
  pattern        = "{ $.message = \"Slow API request*\" }"
  log_group_name = aws_cloudwatch_log_group.app.name

  metric_transformation {
    name          = "SlowRequestCount"
    namespace     = "MachineryRentals"
    value         = "1"
    default_value = "0"
  }
}

# Application error alarm (from log metrics)
resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_name          = "${local.name_prefix}-app-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 20
  alarm_description   = "Application error count exceeds 20 per minute"
  
  metric_name = "ErrorCount"
  namespace   = "MachineryRentals"
  period      = 60
  statistic   = "Sum"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-app-errors"
    Severity = "critical"
  }
}

# Job failure alarm
resource "aws_cloudwatch_metric_alarm" "job_failures" {
  alarm_name          = "${local.name_prefix}-job-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_description   = "Job failure count exceeds 5 per 5 minutes"
  
  metric_name = "JobFailureCount"
  namespace   = "MachineryRentals"
  period      = 300
  statistic   = "Sum"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name     = "${local.name_prefix}-job-failures"
    Severity = "warning"
  }
}
