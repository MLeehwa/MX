# WP2 마이그레이션 스크립트
# WP1을 WP2로 복제하고 테이블명 접두사를 변경합니다.

param(
    [string]$SourceDir = "c:\Users\LHA-M\WP1",
    [string]$TargetDir = "c:\Users\LHA-M\WP2",
    [string]$OldPrefix = "wp1_",
    [string]$NewPrefix = "wp2_"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WP2 마이그레이션 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 폴더 복사
Write-Host "[1/4] 폴더 복사 중..." -ForegroundColor Yellow
if (Test-Path $TargetDir) {
    $response = Read-Host "대상 폴더가 이미 존재합니다. 덮어쓰시겠습니까? (Y/N)"
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "작업이 취소되었습니다." -ForegroundColor Red
        exit
    }
    Remove-Item -Path $TargetDir -Recurse -Force
}
Copy-Item -Path $SourceDir -Destination $TargetDir -Recurse -Force
Write-Host "✓ 폴더 복사 완료" -ForegroundColor Green
Write-Host ""

# 2. JavaScript 파일에서 테이블명 변경
Write-Host "[2/4] JavaScript 파일 수정 중..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path $TargetDir -Filter "*.js" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }
$jsCount = 0
foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 테이블명 변경
    $content = $content -replace "wp1_locations", "wp2_locations"
    $content = $content -replace "wp1_delivery_locations", "wp2_delivery_locations"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $jsCount++
        Write-Host "  - 수정: $($file.Name)" -ForegroundColor Gray
    }
}
Write-Host "✓ JavaScript 파일 $jsCount 개 수정 완료" -ForegroundColor Green
Write-Host ""

# 3. SQL 파일에서 테이블명 변경
Write-Host "[3/4] SQL 파일 수정 중..." -ForegroundColor Yellow
$sqlFiles = Get-ChildItem -Path $TargetDir -Filter "*.sql" -Recurse
$sqlCount = 0
foreach ($file in $sqlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 테이블명 변경
    $content = $content -replace "wp1_locations", "wp2_locations"
    $content = $content -replace "wp1_delivery_locations", "wp2_delivery_locations"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $sqlCount++
        Write-Host "  - 수정: $($file.Name)" -ForegroundColor Gray
    }
}
Write-Host "✓ SQL 파일 $sqlCount 개 수정 완료" -ForegroundColor Green
Write-Host ""

# 4. HTML 파일에서 주석/문서 변경 (선택사항)
Write-Host "[4/4] HTML 파일 확인 중..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Path $TargetDir -Filter "*.html" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }
$htmlCount = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 제목이나 주석에서 WP1을 WP2로 변경 (선택사항)
    # $content = $content -replace "WP1", "WP2"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $htmlCount++
    }
}
Write-Host "✓ HTML 파일 확인 완료" -ForegroundColor Green
Write-Host ""

# 완료 메시지
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "마이그레이션 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Supabase SQL Editor에서 새 테이블 생성 스크립트 실행" -ForegroundColor White
Write-Host "2. admin/sql/ 폴더의 SQL 파일들을 wp2_ 접두사로 수정하여 실행" -ForegroundColor White
Write-Host "3. 새 폴더($TargetDir)에서 시스템 테스트" -ForegroundColor White
Write-Host ""
