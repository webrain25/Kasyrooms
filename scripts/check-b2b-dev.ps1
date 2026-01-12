param(
  [string]$BaseUrl = "https://dev.kasyrooms.com",
  [string]$ExternalUserId = "SMOKE-DEV-" + [string](Get-Date -Format "yyyyMMddHHmmss"),
  [string]$Email = $null,
  [string]$Username = $null
)

Write-Host "Running B2B DEV checks against $BaseUrl" -ForegroundColor Cyan

if (-not $Email) { $Email = "$ExternalUserId@example.local" }
if (-not $Username) { $Username = $ExternalUserId }

function Invoke-Json {
  param(
    [Parameter(Mandatory=$true)][ValidateSet('GET','POST','PUT','PATCH','DELETE')][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [hashtable]$Headers,
    $Body
  )
  $params = @{ Method = $Method; Uri = $Uri; ErrorAction = 'Stop' }
  if ($Headers) { $params.Headers = $Headers }
  if ($Method -in @('POST','PUT','PATCH') -and $null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Compress)
  }
  return Invoke-RestMethod @params
}

# Resolve Basic auth for B2B
$B2B_USER = $env:B2B_BASIC_AUTH_USER
if (-not $B2B_USER) { $B2B_USER = $env:SIRPLAY_B2B_USER }
if (-not $B2B_USER) { $B2B_USER = 'sirplay' }
$B2B_PASS = $env:B2B_BASIC_AUTH_PASS
if (-not $B2B_PASS) { $B2B_PASS = $env:SIRPLAY_B2B_PASS }
if (-not $B2B_PASS) { $B2B_PASS = 's3cr3t' }
$basicAuth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$B2B_USER:$B2B_PASS"))

Write-Host "Seeding user via Sirplay handshake..." -ForegroundColor Yellow
$seedBody = @{ externalUserId = $ExternalUserId; email = $Email; username = $Username }
$seed = Invoke-Json -Method 'POST' -Uri "$BaseUrl/api/sirplay/login" -Body $seedBody
if (-not $seed.token) { Write-Error "Handshake/seed FAILED: no token returned"; exit 1 }
Write-Host "Seed OK: user=$($seed.user.username) id=$($seed.user.id)" -ForegroundColor Green

Write-Host "Requesting B2B login-tokens (positive)..." -ForegroundColor Yellow
$headers = @{ Authorization = $basicAuth }
$lt = $null
try {
  $lt = Invoke-Json -Method 'POST' -Uri "$BaseUrl/api/b2b/login-tokens" -Headers $headers -Body @{ userId = $ExternalUserId }
} catch {
  Write-Error "B2B login-tokens FAILED: $($_.Exception.Message)"; exit 1
}
if (-not $lt.jwt -or -not $lt.ssoToken) { Write-Error "B2B login-tokens FAILED: missing jwt/ssoToken"; exit 1 }
Write-Host "B2B login-tokens OK: expiresIn=$($lt.expiresIn)" -ForegroundColor Green

Write-Host "Requesting B2B login-tokens without auth (negative)..." -ForegroundColor Yellow
$ltNoAuthStatus = 0
try {
  $resp = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/b2b/login-tokens" -ContentType 'application/json' -Body (@{ userId = $ExternalUserId } | ConvertTo-Json -Compress) -ErrorAction Stop
  $ltNoAuthStatus = [int]$resp.StatusCode
} catch {
  # Invoke-WebRequest throws on non-2xx; parse status code if available
  if ($_.Exception.Response) {
    $ltNoAuthStatus = [int]$_.Exception.Response.StatusCode
  } else {
    Write-Error "Unexpected error on negative test: $($_.Exception.Message)"; exit 1
  }
}
if ($ltNoAuthStatus -ne 401) { Write-Error "NEGATIVE EXPECTATION FAILED: expected 401, got $ltNoAuthStatus"; exit 1 }
Write-Host "B2B login-tokens no-auth returns 401 (as expected)" -ForegroundColor Green

Write-Host "All B2B DEV checks completed successfully." -ForegroundColor Cyan
