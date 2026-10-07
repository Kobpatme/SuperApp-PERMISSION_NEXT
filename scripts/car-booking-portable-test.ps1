param([string]$BinaryDirectory = '.data/car-booking-postgres/pgsql/bin', [switch]$ServiceTests, [switch]$BrowserTests, [string]$ClusterName = 'cluster-verified')
$ErrorActionPreference = 'Stop'
$carTestRoot = Join-Path (Get-Location) '.data/car-booking-postgres'
if ($ClusterName -notmatch '^[a-z0-9-]+$') { throw 'Invalid fixture cluster name' }
$carCluster = Join-Path $carTestRoot $ClusterName
$carPasswordFile = Join-Path $carTestRoot $(if ($ClusterName -eq 'cluster-verified') { 'verified-test-password.txt' } else { $ClusterName + '-password.txt' })
$carPgControl = Join-Path $BinaryDirectory 'pg_ctl.exe'
$carInitializer = Join-Path $BinaryDirectory 'initdb.exe'
if (!(Test-Path -LiteralPath $carPgControl)) { throw 'Portable PostgreSQL binaries required' }
if (Get-NetTCPConnection -LocalPort 55439 -State Listen -ErrorAction SilentlyContinue) { throw 'Test port already in use; no existing server was changed' }
if (!(Test-Path -LiteralPath (Join-Path $carCluster 'PG_VERSION'))) {
  $carRandom = [byte[]]::new(32)
  $carGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $carGenerator.GetBytes($carRandom) } finally { $carGenerator.Dispose() }
  $carPassword = [BitConverter]::ToString($carRandom).Replace('-', '')
  [System.IO.File]::WriteAllText($carPasswordFile, $carPassword)
  & $carInitializer -D $carCluster -U car_test_operator --encoding=UTF8 --locale=C --auth=scram-sha-256 --pwfile=$carPasswordFile
  if ($LASTEXITCODE -ne 0) { throw 'Isolated initdb failed' }
}
$carPassword = [System.IO.File]::ReadAllText($carPasswordFile).Trim()
$carPreviousConnection = $env:CAR_BOOKING_TEST_DATABASE_URL
$carStarted = $false
try {
  $carStartArguments = '-D "' + $carCluster + '" -l "' + (Join-Path $carTestRoot 'server.log') + '" -o "-h 127.0.0.1 -p 55439" -w start'
  $carStartProcess = Start-Process -FilePath $carPgControl -ArgumentList $carStartArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $carTestRoot 'startup.log') -RedirectStandardError (Join-Path $carTestRoot 'startup-error.log')
  $carStartProcess.WaitForExit()
  if ($carStartProcess.ExitCode -ne 0) { throw 'Isolated PostgreSQL startup failed' }
  $carStarted = $true
  $env:CAR_BOOKING_TEST_DATABASE_URL = 'postgres://car_test_operator:' + $carPassword + '@127.0.0.1:55439/permission_next_car_booking_test'
  & node scripts/car-booking-test-db.mjs
  if ($LASTEXITCODE -ne 0) { throw 'First migration run failed' }
  & node scripts/car-booking-test-db.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Migration rerun failed' }
  & node --test scripts/car-booking-schema.test.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Car schema integration tests failed' }
  if ($ServiceTests) {
    & node scripts/car-booking-service-test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Car service integration tests failed' }
  }
  if ($BrowserTests) {
    & node scripts/car-booking-browser-fixture.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Browser fixture initialization failed' }
    & node scripts/car-booking-browser-test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Car browser tests failed' }
  }
} finally {
  $env:CAR_BOOKING_TEST_DATABASE_URL = $carPreviousConnection
  if ($carStarted) { & $carPgControl -D $carCluster -m fast -w stop }
}
