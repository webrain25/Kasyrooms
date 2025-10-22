param(
  [string]$BaseUrl = "https://dev.kasyrooms.com"
)

Write-Host "Checking site at $BaseUrl" -ForegroundColor Cyan

function Get-Json($uri, $headers=@{}) {
  try { return Invoke-RestMethod -Uri $uri -Headers $headers -Method Get } catch { Write-Error $_; throw }
}
function Post-Json($uri, $body, $headers=@{}) {
  try { return Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress) } catch { Write-Error $_; throw }
}
function Patch-Json($uri, $body, $headers=@{}) {
  try { return Invoke-RestMethod -Uri $uri -Headers $headers -Method Patch -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress) } catch { Write-Error $_; throw }
}

# Health/version
$health = Get-Json "$BaseUrl/api/healthz"
Write-Host "healthz: " ($health | ConvertTo-Json -Depth 5) -ForegroundColor Green
$version = Get-Json "$BaseUrl/api/version"
Write-Host "version: " ($version | ConvertTo-Json -Depth 5) -ForegroundColor Green

# Model headers (dev)
$modelHeaders = @{ 'x-user-id' = 'm-001'; 'x-role' = 'model' }
$adminHeaders = @{ 'x-user-id' = 'a-001'; 'x-role' = 'admin' }

# Ensure model exists and toggle states
$model = Get-Json "$BaseUrl/api/models/m-001"
Write-Host "model (before):" ($model | ConvertTo-Json -Depth 5)

$model = Patch-Json "$BaseUrl/api/models/m-001/status" @{ isOnline = $true } $modelHeaders
Write-Host "status->online:" ($model | ConvertTo-Json -Depth 5)

$model = Patch-Json "$BaseUrl/api/models/m-001/busy" @{ isBusy = $false } $modelHeaders
Write-Host "busy->false:" ($model | ConvertTo-Json -Depth 5)

# Add a photo
$photos = Post-Json "$BaseUrl/api/models/m-001/photos" @{ url = "https://picsum.photos/seed/$([int](Get-Random -Maximum 100000))/600/800" } $modelHeaders
Write-Host "photos after add:" ($photos | ConvertTo-Json -Depth 5)

# Operator demo data
$deposit = Post-Json "$BaseUrl/api/wallet/deposit" @{ userId = 'u-001'; amount = 10; source = 'check-site' }
Write-Host "deposit:" ($deposit | ConvertTo-Json -Depth 5)

$start = Post-Json "$BaseUrl/api/sessions/start" @{ userId_B = 'u-001'; modelId = 'm-001' }
Start-Sleep -Seconds 1
$end = Post-Json "$BaseUrl/api/sessions/$($start.id)/end" @{ durationSec = 60; totalCharged = 2 }
Write-Host "session end:" ($end | ConvertTo-Json -Depth 5)

$tx = Get-Json "$BaseUrl/api/operator/transactions" $adminHeaders
Write-Host "transactions:" ($tx | ConvertTo-Json -Depth 5)
$sess = Get-Json "$BaseUrl/api/operator/sessions" $adminHeaders
Write-Host "sessions:" ($sess | ConvertTo-Json -Depth 5)

Write-Host "All checks completed successfully." -ForegroundColor Green
