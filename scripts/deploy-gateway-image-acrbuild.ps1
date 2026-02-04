$ErrorActionPreference = 'Stop'

# Config
$registry   = 'ledger1acr'
$repo       = 'azure-realtime-gateway'
$sourcePath = 'u:\TUCCRM\basaltcrm-app\aws\azure-gateway'
$subId      = '0a8c8695-c09e-45cc-8a64-697faedee923'
$rgName     = 'ledger1-rt-gw'
$appName    = 'ledger1-gateway'
$apiVersion = '2025-01-01'

# Timestamp tag and revision
$tag = (Get-Date).ToString('yyyyMMddHHmmss')
$rev = 'code-' + $tag
Write-Host "Starting ACR remote build: $registry/$($repo):$tag"

# Remote build in ACR (no local Docker needed)
az acr build --registry $registry --image "$($repo):$tag" "$sourcePath"

# Patch Container App to use new image
$resourceId = "/subscriptions/$subId/resourceGroups/$rgName/providers/Microsoft.App/containerApps/$appName"
$baseUrl    = "https://management.azure.com$resourceId"

Write-Host "Fetching current Container App template..."
$resJson = az rest --method get --url $baseUrl --url-parameters "api-version=$apiVersion"
$res     = $resJson | ConvertFrom-Json
$containers = $res.properties.template.containers
# Use fully-qualified image name in Container App
$containers[0].image = "${registry}.azurecr.io/${repo}:$tag"

$bodyObj = [ordered]@{
  properties = [ordered]@{
    template = [ordered]@{
      revisionSuffix = $rev
      containers     = $containers
    }
  }
}

$temp = [System.IO.Path]::GetTempFileName()
$bodyJson = $bodyObj | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($temp, $bodyJson)
Write-Host "PATCH body written to $temp"

Write-Host "Updating Container App to image ${registry}.azurecr.io/${repo}:$tag ..."
az rest --method patch --url $baseUrl --url-parameters "api-version=$apiVersion" --headers "Content-Type=application/json" --body "@${temp}"

Write-Host "Verifying updated image..."
az rest --method get --url $baseUrl --url-parameters "api-version=$apiVersion" --query "properties.template.containers[0].image" --output tsv
