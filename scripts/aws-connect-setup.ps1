param(
  [string]$Region = "us-west-2",
  [string]$InstanceId,
  [string]$BucketName,
  [string]$RecordingsPrefix = "connect/recordings/",
  [string]$TranscriptsPrefix = "connect/transcripts/",
  [string]$ReportsPrefix = "connect/reports/",
  [string]$KmsArn = "arn:aws:kms:us-west-2:867344432514:key/0f7ee07b-6465-476d-b43c-ee1433431a37",
  [switch]$ConfigureStorage
)

# Utility: Execute AWS CLI and parse JSON
function Invoke-AwsJson {
  param([string]$Args)
  $out = aws $Args 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Error "AWS CLI command failed: $out"
    throw "AWS CLI failed"
  }
  try { return ($out | ConvertFrom-Json) } catch { return $out }
}

# Utility: Select item from an array interactively
function Select-Item {
  param([array]$Items, [string]$LabelProperty = "Name", [string]$IdProperty = "Id", [string]$Title)
  if (-not $Items -or $Items.Count -eq 0) { throw "No items to select: $Title" }
  Write-Host "`n$Title" -ForegroundColor Cyan
  for ($i=0; $i -lt $Items.Count; $i++) {
    $name = $Items[$i].$LabelProperty
    $id = $Items[$i].$IdProperty
    Write-Host ("[{0}] {1} ({2})" -f $i, $name, $id)
  }
  do {
    $sel = Read-Host "Enter selection index"
  } while (-not ($sel -as [int]) -or [int]$sel -lt 0 -or [int]$sel -ge $Items.Count)
  return $Items[[int]$sel]
}

Write-Host "AWS Connect setup starting..." -ForegroundColor Green

# Confirm AWS CLI auth
$caller = Invoke-AwsJson -Args "sts get-caller-identity"
Write-Host ("Using AWS principal: {0}" -f $caller.Arn) -ForegroundColor Yellow

# Ensure region is set for this session (AWS CLI reads config; we pass --region explicitly)
Write-Host ("Region: {0}" -f $Region)

# Discover InstanceId if not provided
if (-not $InstanceId -or $InstanceId.Trim().Length -eq 0) {
  $instances = Invoke-AwsJson -Args "connect list-instances --region $Region"
  if ($instances.Instances.Count -gt 1) {
    $picked = Select-Item -Items $instances.Instances -LabelProperty "Arn" -IdProperty "Id" -Title "Select Amazon Connect Instance"
    $InstanceId = $picked.Id
  } elseif ($instances.Instances.Count -eq 1) {
    $InstanceId = $instances.Instances[0].Id
  } else {
    throw "No Amazon Connect instances found in region $Region"
  }
}
Write-Host ("InstanceId: {0}" -f $InstanceId) -ForegroundColor Yellow

# Discover Contact Flow and Queue
$flows = Invoke-AwsJson -Args "connect list-contact-flows --instance-id $InstanceId --region $Region"
if (-not $flows.ContactFlowSummaryList) { throw "No contact flows found for instance $InstanceId" }
$flowPick = Select-Item -Items $flows.ContactFlowSummaryList -LabelProperty "Name" -IdProperty "Id" -Title "Select OUTBOUND Contact Flow"
$FlowId = $flowPick.Id
Write-Host ("Selected ContactFlowId: {0}" -f $FlowId) -ForegroundColor Yellow

$queues = Invoke-AwsJson -Args "connect list-queues --instance-id $InstanceId --region $Region"
if (-not $queues.QueueSummaryList) { throw "No queues found for instance $InstanceId" }
$queuePick = Select-Item -Items $queues.QueueSummaryList -LabelProperty "Name" -IdProperty "Id" -Title "Select Queue for outbound calls"
$QueueId = $queuePick.Id
Write-Host ("Selected QueueId: {0}" -f $QueueId) -ForegroundColor Yellow

# Write .env.local in basaltcrm-app root
$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
Write-Host ("Writing environment file: {0}" -f $envPath) -ForegroundColor Cyan
$envText = if (Test-Path $envPath) { Get-Content $envPath -Raw } else { "" }
function Set-EnvLine([string]$key, [string]$value) {
  $pattern = "^{0}=.*$" -f [regex]::Escape($key)
  if ($envText -match $pattern) {
    $envText = [regex]::Replace($envText, $pattern, "$key=$value", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline)
  } else {
    if ($envText.Length -gt 0 -and -not $envText.EndsWith("`r`n")) { $envText += "`r`n" }
    $envText += "$key=$value`r`n"
  }
}
Set-EnvLine "AWS_REGION" $Region
Set-EnvLine "CONNECT_INSTANCE_ID" $InstanceId
Set-EnvLine "CONNECT_CONTACT_FLOW_ID" $FlowId
Set-EnvLine "CONNECT_QUEUE_ID" $QueueId
# Optional other services (keep existing if present)
Set-EnvLine "SES_REGION" $Region
Set-EnvLine "OPTIONAL_KMS_ARN" $KmsArn
Set-Content -Path $envPath -Value $envText -Encoding UTF8
Write-Host "Updated .env.local with Connect IDs." -ForegroundColor Green

# Optionally configure S3+KMS storage configs
if ($ConfigureStorage) {
  if (-not $BucketName -or $BucketName.Trim().Length -eq 0) { throw "BucketName is required when -ConfigureStorage is set" }
  Write-Host "Configuring instance storage configs (CALL_RECORDINGS, CHAT_TRANSCRIPTS, SCHEDULED_REPORTS)" -ForegroundColor Cyan

  function Ensure-StorageConfig([string]$resourceType, [string]$prefix) {
    $list = Invoke-AwsJson -Args "connect list-instance-storage-configs --instance-id $InstanceId --resource-type $resourceType --region $Region"
    $existing = $list.StorageConfigs
    $needs = $true
    if ($existing) {
      foreach ($sc in $existing) {
        if ($sc.StorageType -eq "S3" -and $sc.S3Config.BucketName -eq $BucketName -and $sc.S3Config.BucketPrefix -eq $prefix) {
          $needs = $false
          Write-Host ("Existing storage config found for {0} -> s3://{1}/{2}" -f $resourceType, $BucketName, $prefix) -ForegroundColor Yellow
          break
        }
      }
    }
    if ($needs) {
      $cfg = @{ StorageType = "S3"; S3Config = @{ BucketName = $BucketName; BucketPrefix = $prefix; EncryptionConfig = @{ EncryptionType = "KMS"; KeyId = $KmsArn } } }
      $json = $cfg | ConvertTo-Json -Depth 6
      Write-Host ("Associating storage config {0} -> s3://{1}/{2}" -f $resourceType, $BucketName, $prefix)
      $assocOut = aws connect associate-instance-storage-config --instance-id $InstanceId --resource-type $resourceType --storage-config "$json" --region $Region 2>&1
      if ($LASTEXITCODE -ne 0) { Write-Error $assocOut; throw "Failed to associate storage config: $resourceType" }
      Write-Host ("Associated {0}" -f $resourceType) -ForegroundColor Green
    }
  }

  Ensure-StorageConfig -resourceType "CALL_RECORDINGS" -prefix $RecordingsPrefix
  Ensure-StorageConfig -resourceType "CHAT_TRANSCRIPTS" -prefix $TranscriptsPrefix
  Ensure-StorageConfig -resourceType "SCHEDULED_REPORTS" -prefix $ReportsPrefix
}

# Confirm CloudWatch log group presence
Write-Host "Checking CloudWatch log groups for Connect" -ForegroundColor Cyan
$lg = Invoke-AwsJson -Args "logs describe-log-groups --log-group-name-prefix /aws/connect/ --region $Region"
if ($lg.logGroups) {
  foreach ($g in $lg.logGroups) { Write-Host ("Found log group: {0}" -f $g.logGroupName) }
} else {
  Write-Host "No /aws/connect/ log groups found; logging may need to be enabled in the Connect console." -ForegroundColor Yellow
}

Write-Host "AWS Connect setup completed." -ForegroundColor Green
