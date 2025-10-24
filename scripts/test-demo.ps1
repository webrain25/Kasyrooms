#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Config
$BaseUrl = 'https://dev.kasyrooms.com'
$HeadersJson = @{ 'Content-Type' = 'application/json' }

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "[ERR] $msg" -ForegroundColor Red }

function Login-User([string]$username) {
  $body = @{ username = $username } | ConvertTo-Json -Compress
  $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HeadersJson -Body $body
  return $res
}

try {
  Write-Step "Health check"
  $ver = Invoke-RestMethod -Uri "$BaseUrl/api/version" -Method Get
  Write-Ok "Version: $($ver.version) @ $($ver.time)"

  # Admin flow
  Write-Step "Login admin"
  $adm = Login-User -username 'admin'
  $admToken = $adm.token
  if (-not $admToken) { throw 'Admin token missing' }
  Write-Ok "Admin user: $($adm.user.id) role=$($adm.user.role)"

  Write-Step "Operator transactions (admin)"
  $opTx = Invoke-RestMethod -Uri "$BaseUrl/api/operator/transactions" -Headers @{ Authorization = "Bearer $admToken" }
  $txCount = @($opTx).Count
  Write-Ok "Transactions: $txCount"

  # Model flow
  Write-Step "Login modella"
  $mod = Login-User -username 'modella'
  $modToken = $mod.token
  if (-not $modToken) { throw 'Model token missing' }
  Write-Ok "Model user: $($mod.user.id) role=$($mod.user.role)"

  Write-Step "Model online=true"
  $null = Invoke-RestMethod -Uri "$BaseUrl/api/models/m-001/status" -Method Patch -Headers (@{ Authorization = "Bearer $modToken" } + $HeadersJson) -Body '{"isOnline":true}'
  Write-Ok "m-001 set online=true"

  Write-Step "Model busy=false"
  $null = Invoke-RestMethod -Uri "$BaseUrl/api/models/m-001/busy" -Method Patch -Headers (@{ Authorization = "Bearer $modToken" } + $HeadersJson) -Body '{"isBusy":false}'
  Write-Ok "m-001 set busy=false"

  # Optional add photo
  try {
    $null = Invoke-RestMethod -Uri "$BaseUrl/api/models/m-001/photos" -Method Post -Headers (@{ Authorization = "Bearer $modToken" } + $HeadersJson) -Body '{"url":"https://picsum.photos/seed/demo/400/400"}'
    Write-Ok "Photo added"
  } catch { Write-Host "(skip photo) $_" -ForegroundColor DarkYellow }

  # User flow
  Write-Step "Login utente"
  $usr = Login-User -username 'utente'
  $usrToken = $usr.token
  if (-not $usrToken) { throw 'User token missing' }
  Write-Ok "User: $($usr.user.id) role=$($usr.user.role)"

  Write-Step "Deposit 5 EUR (local wallet)"
  $dep = Invoke-RestMethod -Uri "$BaseUrl/api/wallet/deposit" -Method Post -Headers $HeadersJson -Body '{"userId":"u-001","amount":5,"source":"test"}'
  Write-Ok "Deposit status: $($dep.status) balance=$($dep.newBalance)"

  Write-Step "Start session u-001 <-> m-001"
  $s = Invoke-RestMethod -Uri "$BaseUrl/api/sessions/start" -Method Post -Headers $HeadersJson -Body '{"userId_B":"u-001","modelId":"m-001"}'
  if (-not $s.id) { throw 'Session id missing' }
  Write-Ok "Session started: $($s.id)"

  Start-Sleep -Seconds 1

  Write-Step "End session (60s, 2 EUR)"
  $e = Invoke-RestMethod -Uri ("$BaseUrl/api/sessions/" + $s.id + "/end") -Method Post -Headers $HeadersJson -Body '{"durationSec":60,"totalCharged":2}'
  Write-Ok "Session ended: id=$($e.id) charged=$($e.totalCharged)"

  Write-Step "Operator sessions (admin)"
  $opSes = Invoke-RestMethod -Uri "$BaseUrl/api/operator/sessions" -Headers @{ Authorization = "Bearer $admToken" }
  $sesCount = @($opSes).Count
  Write-Ok "Sessions: $sesCount (last id: $($opSes[0].id))"

  Write-Host "`nAll checks passed ✅" -ForegroundColor Green

} catch {
  Write-Err $_
  exit 1
}
