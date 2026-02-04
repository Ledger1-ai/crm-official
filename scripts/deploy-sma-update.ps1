param(
  [string]$FunctionName = "chime-sma-bridge",
  [string]$Region = "us-west-2"
)

$ErrorActionPreference = 'Stop'

# Temp workspace
$tmp = Join-Path $env:TEMP "sma_pkg"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Path $tmp | Out-Null
$codeZip   = Join-Path $tmp 'code.zip'
$unpacked  = Join-Path $tmp 'unpacked'
$newZip    = Join-Path $tmp 'new.zip'

# Fetch current code bundle
$url = aws lambda get-function --function-name $FunctionName --region $Region --query Code.Location --output text
Write-Host "Downloading current Lambda bundle..."
Invoke-WebRequest -Uri $url -OutFile $codeZip
Expand-Archive -Path $codeZip -DestinationPath $unpacked -Force

# Replace handlers with our updated files from repo
$localHandler = "u:\\TUCCRM\\basaltcrm-app\\aws\\chime-sma-lambda\\handler.js"
$localHandlerBasic = "u:\\TUCCRM\\basaltcrm-app\\aws\\chime-sma-lambda\\handler-basic.js"

if (Test-Path $localHandler) {
  Copy-Item $localHandler (Join-Path $unpacked 'handler.js') -Force
} else {
  Write-Warning "handler.js not found at $localHandler (skipping)"
}

if (Test-Path $localHandlerBasic) {
  Copy-Item $localHandlerBasic (Join-Path $unpacked 'handler-basic.js') -Force
} else {
  Write-Warning "handler-basic.js not found at $localHandlerBasic (skipping)"
}

# Repack and update function code
Compress-Archive -Path (Join-Path $unpacked '*') -DestinationPath $newZip -Force
Write-Host "Updating Lambda code for $FunctionName in $Region..."
aws lambda update-function-code --function-name $FunctionName --zip-file fileb://$newZip --region $Region | Out-Host
Write-Host "Done."
