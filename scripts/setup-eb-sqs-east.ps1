Param(
  [string]$Region = "us-east-1",
  [string]$RuleName = "ledger1-vc-streaming-rule-east",
  [string]$QueueUrl = "https://sqs.us-east-1.amazonaws.com/867344432514/ledger1-vc-streaming-events-east"
)

Write-Host "[SETUP] Region=$Region Rule=$RuleName QueueUrl=$QueueUrl"

# Ensure rule exists (pattern already created on disk)
aws events put-rule --name $RuleName --event-pattern file://u:/TUCCRM/basaltcrm-app/aws/eventbridge/chime-vc-events-pattern.json --region $Region | Out-Host

# Resolve ARNs
$RuleArn = aws events describe-rule --name $RuleName --region $Region --query Arn --output text
$QueueArn = aws sqs get-queue-attributes --queue-url $QueueUrl --region $Region --attribute-names QueueArn --query 'Attributes.QueueArn' --output text
Write-Host "[SETUP] RuleArn=$RuleArn"; Write-Host "[SETUP] QueueArn=$QueueArn"

# Bind rule target to SQS
aws events put-targets --rule $RuleName --targets Id=vcSqsEast,Arn=$QueueArn --region $Region | Out-Host

# Build SQS policy to allow EventBridge to send messages
$policyObj = @{ 
  Version = "2012-10-17"; 
  Statement = @(
    @{ 
      Sid = "AllowEventBridgeToSend";
      Effect = "Allow";
      Principal = @{ Service = "events.amazonaws.com" };
      Action = "sqs:SendMessage";
      Resource = $QueueArn;
      Condition = @{ ArnEquals = @{ "aws:SourceArn" = $RuleArn } } 
    }
  )
} | ConvertTo-Json -Depth 5 -Compress

# Apply policy to SQS queue via file to avoid CLI parsing issues
$attrsJson = @{ Policy = $policyObj } | ConvertTo-Json -Compress
$attrsPath = "u:/TUCCRM/basaltcrm-app/aws/eventbridge/sqs-attributes-east.json"
Set-Content -Path $attrsPath -Value $attrsJson -Encoding Ascii
aws sqs set-queue-attributes --queue-url $QueueUrl --region $Region --attributes file://$attrsPath | Out-Host

# Start poller for verification
Set-Location "u:/TUCCRM/basaltcrm-app/aws/vc-streaming-consumer"
npm exec -y pnpm exec ts-node src/sqs-poller.ts -- --queue-url $QueueUrl --region $Region --wait 20 --max 10
