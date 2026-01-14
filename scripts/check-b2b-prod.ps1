param(
  [string]$BaseUrl = $env:BASE_URL,
  [string]$BasicUser = $env:BASIC_USER,
  [string]$BasicPass = $env:BASIC_PASS,
  [string]$CustomerId = $env:SIRPLAY_CUSTOMER_ID
)

if (-not $BaseUrl) { Write-Error "BASE_URL not set. Set with `$env:BASE_URL or pass -BaseUrl."; exit 1 }
if (-not $BasicUser -or -not $BasicPass) { Write-Warning "BASIC_USER/BASIC_PASS not set. Some tests will fail (401)." }

function Invoke-CurlJson {
  param(
    [Parameter(Mandatory=$true)][ValidateSet('GET','POST','PUT','DELETE')] [string]$Method,
    [Parameter(Mandatory=$true)][string]$Url,
    [hashtable]$Headers = @{ 'Content-Type' = 'application/json'; 'Accept' = 'application/json' },
    [string]$Body = $null,
    [string]$BasicAuth = $null
  )
  $tmp = [System.IO.Path]::GetTempFileName()
  $args = @('-s','-L','-o', $tmp, '-w','%{http_code}', '-X', $Method, $Url)
  foreach ($k in $Headers.Keys) {
    $h = "{0}: {1}" -f $k, $Headers[$k]
    $args += @('-H', $h)
  }
  if ($BasicAuth) { $args += @('-u', $BasicAuth) }
  if ($Body) { $args += @('--data', $Body) }
  $code = & curl.exe @args
  $resp = Get-Content -Path $tmp -Raw
  Remove-Item $tmp -ErrorAction SilentlyContinue
  return [pscustomobject]@{ StatusCode = [int]$code; Body = $resp }
}

function Minify-JsonString([hashtable]$obj) {
  return ($obj | ConvertTo-Json -Depth 6 -Compress)
}

Write-Host "BaseUrl:" $BaseUrl
if ($BasicUser) { Write-Host "Basic user:" $BasicUser } else { Write-Host "Basic user: (none)" }

# 1) REGISTER (Basic)
$registerUrl = "$BaseUrl/user-account/signup/b2b/registrations"
$registerBody = Minify-JsonString(@{
  eventId = 'evt-001'
  customerId = ($CustomerId ? $CustomerId : '572')
  operation = 'REGISTER'
  action = 'USER_REGISTRATION'
  eventTime = [int][double]::Parse(([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()).ToString())
  userData = @{
    userId = 'SIRPLAY-USER-001'
    userName = 'john_doe'
    status = 'ACTIVE'
    email = 'john@example.com'
  }
})
$reg = Invoke-CurlJson -Method POST -Url $registerUrl -Body $registerBody -BasicAuth "$BasicUser`:$BasicPass"
Write-Host "REGISTER ->" $reg.StatusCode $reg.Body

# Parse local externalId from response (Kasyrooms local user id)
$localId = $null
try {
  $regJson = $reg.Body | ConvertFrom-Json -ErrorAction Stop
  $localId = $regJson.userData.externalId
} catch {}
if (-not $localId) { Write-Warning "Could not parse local externalId from REGISTER response." }

# 2) UPDATE (Basic)
$updateUrl = "$BaseUrl/user-account/signup/b2b/registrations"
$updateBody = Minify-JsonString(@{
  eventId = 'evt-002'
  operation = 'UPDATE'
  action = 'USER_UPDATE'
  eventTime = 1703894500000
  userData = @{
    externalId = ($localId ? $localId : 'LOCAL-NOT-SET')
    lastUpdated = '2025-12-30T10:00:00Z'
    email = 'newmail@example.com'
    status = 'ACTIVE'
  }
})
$upd = Invoke-CurlJson -Method PUT -Url $updateUrl -Body $updateBody -BasicAuth "$BasicUser`:$BasicPass"
Write-Host "UPDATE ->" $upd.StatusCode $upd.Body

# 3) LOGIN TOKENS (Basic)
$tokensUrl = "$BaseUrl/api/b2b/login-tokens"
$tokensBody = Minify-JsonString(@{ externalId = ($localId ? $localId : 'LOCAL-NOT-SET') })
$tok = Invoke-CurlJson -Method POST -Url $tokensUrl -Body $tokensBody -BasicAuth "$BasicUser`:$BasicPass"
Write-Host "LOGIN TOKENS ->" $tok.StatusCode $tok.Body

# 4.1) REGISTER without Basic (negative)
$badReg = Invoke-CurlJson -Method POST -Url $registerUrl -Body '{}'
Write-Host "REGISTER (no basic) ->" $badReg.StatusCode $badReg.Body

# 4.2) UPDATE with wrong Basic
$wrongUpd = Invoke-CurlJson -Method PUT -Url $updateUrl -Body '{}' -BasicAuth 'wrong:wrong'
Write-Host "UPDATE (wrong basic) ->" $wrongUpd.StatusCode $wrongUpd.Body

# 4.3) LOGIN TOKENS for missing user (negative)
$missingBody = Minify-JsonString(@{ externalId = ('missing-' + [guid]::NewGuid().ToString()) })
$missingTok = Invoke-CurlJson -Method POST -Url $tokensUrl -Body $missingBody -BasicAuth "$BasicUser`:$BasicPass"
Write-Host "LOGIN TOKENS (missing user) ->" $missingTok.StatusCode $missingTok.Body

Write-Host "Done."
