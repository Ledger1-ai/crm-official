$ErrorActionPreference = 'Stop'

# Params
$acrName = 'ledger1acr'
$acrImage = 'ledger1acr.azurecr.io/azure-realtime-gateway'
$srcPath = 'u:\TUCCRM\basaltcrm-app\aws\azure-gateway'
$subId = '0a8c8695-c09e-45cc-8a64-697faedee923'
$rgName = 'ledger1-rt-gw'
$appName = 'ledger1-gateway'
$apiVersion = '2025-01-01'

# Generate tag and revision
$tag = (Get-Date).ToString('yyyyMMddHHmmss')
$rev = 'code-' + $tag
Write-Host "Using tag $tag and revisionSuffix $rev"

# Login to ACR and build/push image
az acr login --name $acrName
Write-Host "Building image $($acrImage):$tag from $srcPath"
docker build -t "$($acrImage):$tag" "$srcPath"
Write-Host "Pushing image $($acrImage):$tag"
docker push "$($acrImage):$tag"

# Patch Container App to use new image and revisionSuffix
$resourceId = "/subscriptions/$subId/resourceGroups/$rgName/providers/Microsoft.App/containerApps/$appName"
$baseUrl = "https://management.azure.com$resourceId"

Write-Host "Fetching current Container App template..."
$resJson = az rest --method get --url $baseUrl --url-parameters "api-version=$apiVersion"
$res = $resJson | ConvertFrom-Json
$containers = $res.properties.template.containers
$containers[0].image = "$($acrImage):$tag"

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

Write-Host "Updating Container App to new image..."
az rest --method patch --url $baseUrl --url-parameters "api-version=$apiVersion" --headers "Content-Type=application/json" --body "@${temp}"

Write-Host "Verifying updated image..."
az rest --method get --url $baseUrl --url-parameters "api-version=$apiVersion" --query "properties.template.containers[0].image" --output tsv
