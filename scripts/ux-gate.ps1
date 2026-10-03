param([Parameter(Mandatory=$true)][string]$Phase)
$ErrorActionPreference = 'Stop'
$results = [ordered]@{}
foreach ($gate in @('lint','typecheck','test','test:documents','build','check:contrast')) {
  & npm run $gate *> "docs/quality/ux-login-evidence/$Phase-$($gate.Replace(':','-')).log"
  $results[$gate]=$LASTEXITCODE
  Write-Output "$gate`: exit $LASTEXITCODE"
  if($LASTEXITCODE -ne 0){ $results | ConvertTo-Json | Set-Content "docs/quality/ux-login-evidence/$Phase-gates.json"; exit $LASTEXITCODE }
}
& npm audit --omit=dev *> "docs/quality/ux-login-evidence/$Phase-audit.log"
$results['audit']=$LASTEXITCODE
$results | ConvertTo-Json | Set-Content "docs/quality/ux-login-evidence/$Phase-gates.json"
Write-Output "audit: exit $LASTEXITCODE"
exit $LASTEXITCODE
