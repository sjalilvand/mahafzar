# ================================================================
#  SCRIPT 35 - FIX SHOP IMPORT DEPTH (3 files) + BUILD + v15
# ================================================================
 $ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
 $ProjectPath = "E:\mahafzar-portal"
 $FE  = "$ProjectPath\frontend"
 $Bak = "$ProjectPath\_Analysis_Reports\Backups"
 $Stamp = Get-Date -Format 'yyyyMMdd_HHmm'

# ---------- 1) Fix imports in the 3 broken files ----------
 $targets = @(
  "$FE\src\pages\shop\Shop.jsx",
  "$FE\src\pages\shop\Cart.jsx",
  "$FE\src\pages\blog\Blog.jsx"
)
foreach ($f in $targets) {
    if (-not (Test-Path $f)) { Write-Host "[MISS] $f" -ForegroundColor Red; continue }
    Copy-Item $f "$Bak\$([IO.Path]::GetFileName($f)).bak_$Stamp" -Force
    $c = Get-Content $f -Raw
    $before = $c
    $c = $c -replace "from '\.\./api/client'", "from '../../api/client'"
    $c = $c -replace 'from "\.\./api/client"', 'from "../../api/client"'
    $c = $c -replace "from '\.\./cartStore'", "from '../../cartStore'"
    $c = $c -replace 'from "\.\./cartStore"', 'from "../../cartStore"'
    if ($c -ne $before) { $c | Set-Content $f -Encoding UTF8; Write-Host "[FIXED] $([IO.Path]::GetFileName($f))" -ForegroundColor Green }
    else { Write-Host "[SKIP] $([IO.Path]::GetFileName($f)) (no one-level import found)" -ForegroundColor Yellow }
}

# ---------- 2) Global sweep: any other wrong-depth import in pages subfolders ----------
Get-ChildItem "$FE\src\pages" -Recurse -File -Include *.jsx | ForEach-Object {
    $rel = $_.DirectoryName.Substring("$FE\src\pages".Length).TrimStart('\')
    $depth = ($rel -split '\\').Count   # 1 = directly in pages, 2 = in a subfolder
    if ($depth -ge 2 -and (Get-Content $_.FullName -Raw) -match "from '\.\./(\.\./)?(api/client|cartStore)'" -and
        (Get-Content $_.FullName -Raw) -match "from '\.\./api/client'|from '\.\./cartStore'") {
        Write-Host "[WARN] still one-level: $($_.FullName.Replace($FE,''))" -ForegroundColor Yellow
    }
}

# ---------- 3) Build + proof ----------
Write-Host "`nBUILDING..." -ForegroundColor Cyan
Push-Location $FE; npm run build; $ok = ($LASTEXITCODE -eq 0); Pop-Location
if (-not $ok) { Write-Host "[FAIL] build failed - send output" -ForegroundColor Red; return }
 $b = Get-ChildItem "$FE\dist\assets\index-*.js" | Sort-Object Length -Descending | Select-Object -First 1
if ((Select-String -Path $b.FullName -Pattern 'فروش فوق‌العاده' -List -Quiet) -and
    (Select-String -Path $b.FullName -Pattern 'سبد خرید' -List -Quiet) -and
    (Select-String -Path $b.FullName -Pattern 'مدیریت فروشگاه' -List -Quiet)) {
    Write-Host "[PROOF] shop + cart + admin shop ALL in bundle" -ForegroundColor Green
}

# ---------- 4) Package v15 (replaces broken v14) ----------
 $Stage = "$env:TEMP\mahai_stage_$Stamp"
New-Item -ItemType Directory -Path "$Stage\backend","$Stage\frontend" -Force | Out-Null
Copy-Item "$FE\dist\*" "$Stage\frontend\" -Recurse -Force
robocopy "$ProjectPath\backend" "$Stage\backend" /E /XD __pycache__ .venv node_modules instance /XF *.pyc backend.log /NFL /NDL /NJH /NJS /NP | Out-Null
Copy-Item "$ProjectPath\deploy" "$Stage\deploy" -Recurse -Force -ErrorAction SilentlyContinue
foreach ($f in @("README.md","DEPLOY_GUIDE.md")) { Copy-Item "$ProjectPath\$f" "$Stage\" -Force -ErrorAction SilentlyContinue }
Compress-Archive -Path "$Stage\*" -DestinationPath "E:\mahai_release_v15_$Stamp.zip" -Force
Write-Host "`n[OK] PACKAGE: E:\mahai_release_v15_$Stamp.zip" -ForegroundColor Green
Write-Host "[i] v14 ناقص را حذف کنید:" -ForegroundColor Yellow
Write-Host "      Remove-Item E:\mahai_release_v14_*.zip" -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) { Push-Location $ProjectPath; git add .; git commit -m "fix: shop import depth (../../ for nested pages)" | Out-Null; Pop-Location -ErrorAction SilentlyContinue }
Write-Host "SCRIPT 35 FINISHED - Ctrl+Shift+R و برو به /shop" -ForegroundColor Magenta
