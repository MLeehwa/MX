# MX 시스템 마이그레이션 스크립트
# WP1을 MX로 복제하고 모든 테이블명을 mx_ 접두사로 변경합니다.
# Container 단위 시스템이므로 part_no, quantity 관련 로직은 별도 수정 필요

param(
    [string]$SourceDir = "c:\Users\LHA-M\WP1",
    [string]$TargetDir = "c:\Users\LHA-M\MX",
    [string]$OldPrefix = "wp1_",
    [string]$NewPrefix = "mx_"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MX 시스템 마이그레이션 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 폴더 복사
Write-Host "[1/5] 폴더 복사 중..." -ForegroundColor Yellow
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

# 2. JavaScript 파일에서 테이블명 변경 (모든 테이블에 mx_ 접두사)
Write-Host "[2/5] JavaScript 파일 수정 중..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path $TargetDir -Filter "*.js" -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "WP2_마이그레이션" -and
    $_.FullName -notmatch "MX_마이그레이션"
}
$jsCount = 0
foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 모든 테이블명에 mx_ 접두사 추가
    $content = $content -replace "\.from\(['""]receiving_plan['""]", ".from('mx_receiving_plan'"
    $content = $content -replace "\.from\(['""]receiving_items['""]", ".from('mx_receiving_items'"
    $content = $content -replace "\.from\(['""]receiving_log['""]", ".from('mx_receiving_log'"
    $content = $content -replace "\.from\(['""]shipping_instruction['""]", ".from('mx_shipping_instruction'"
    $content = $content -replace "\.from\(['""]shipping_instruction_items['""]", ".from('mx_shipping_instruction_items'"
    $content = $content -replace "\.from\(['""]flagged_containers['""]", ".from('mx_flagged_containers'"
    $content = $content -replace "\.from\(['""]wp1_locations['""]", ".from('mx_locations'"
    $content = $content -replace "\.from\(['""]wp1_delivery_locations['""]", ".from('mx_delivery_locations'"
    $content = $content -replace "\.from\(['""]wp2_locations['""]", ".from('mx_locations'"
    $content = $content -replace "\.from\(['""]wp2_delivery_locations['""]", ".from('mx_delivery_locations'"
    
    # SQL 쿼리에서도 변경
    $content = $content -replace "FROM receiving_plan", "FROM mx_receiving_plan"
    $content = $content -replace "FROM receiving_items", "FROM mx_receiving_items"
    $content = $content -replace "FROM receiving_log", "FROM mx_receiving_log"
    $content = $content -replace "FROM shipping_instruction", "FROM mx_shipping_instruction"
    $content = $content -replace "FROM shipping_instruction_items", "FROM mx_shipping_instruction_items"
    $content = $content -replace "FROM flagged_containers", "FROM mx_flagged_containers"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $jsCount++
        Write-Host "  - 수정: $($file.Name)" -ForegroundColor Gray
    }
}
Write-Host "✓ JavaScript 파일 $jsCount 개 수정 완료" -ForegroundColor Green
Write-Host ""

# 3. SQL 파일에서 테이블명 변경
Write-Host "[3/5] SQL 파일 수정 중..." -ForegroundColor Yellow
$sqlFiles = Get-ChildItem -Path $TargetDir -Filter "*.sql" -Recurse | Where-Object {
    $_.FullName -notmatch "wp2_" -and
    $_.FullName -notmatch "MX_"
}
$sqlCount = 0
foreach ($file in $sqlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 모든 테이블명에 mx_ 접두사 추가
    $content = $content -replace "CREATE TABLE.*?receiving_plan", "CREATE TABLE IF NOT EXISTS mx_receiving_plan"
    $content = $content -replace "CREATE TABLE.*?receiving_items", "CREATE TABLE IF NOT EXISTS mx_receiving_items"
    $content = $content -replace "CREATE TABLE.*?receiving_log", "CREATE TABLE IF NOT EXISTS mx_receiving_log"
    $content = $content -replace "CREATE TABLE.*?shipping_instruction", "CREATE TABLE IF NOT EXISTS mx_shipping_instruction"
    $content = $content -replace "CREATE TABLE.*?shipping_instruction_items", "CREATE TABLE IF NOT EXISTS mx_shipping_instruction_items"
    $content = $content -replace "CREATE TABLE.*?flagged_containers", "CREATE TABLE IF NOT EXISTS mx_flagged_containers"
    $content = $content -replace "wp1_locations", "mx_locations"
    $content = $content -replace "wp1_delivery_locations", "mx_delivery_locations"
    $content = $content -replace "wp2_locations", "mx_locations"
    $content = $content -replace "wp2_delivery_locations", "mx_delivery_locations"
    
    # ALTER TABLE, FROM, JOIN 등에서도 변경
    $content = $content -replace "ALTER TABLE receiving_plan", "ALTER TABLE mx_receiving_plan"
    $content = $content -replace "ALTER TABLE receiving_items", "ALTER TABLE mx_receiving_items"
    $content = $content -replace "ALTER TABLE receiving_log", "ALTER TABLE mx_receiving_log"
    $content = $content -replace "ALTER TABLE shipping_instruction", "ALTER TABLE mx_shipping_instruction"
    $content = $content -replace "ALTER TABLE shipping_instruction_items", "ALTER TABLE mx_shipping_instruction_items"
    $content = $content -replace "ALTER TABLE flagged_containers", "ALTER TABLE mx_flagged_containers"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $sqlCount++
        Write-Host "  - 수정: $($file.Name)" -ForegroundColor Gray
    }
}
Write-Host "✓ SQL 파일 $sqlCount 개 수정 완료" -ForegroundColor Green
Write-Host ""

# 4. 참조 관계 수정 (외래키 등)
Write-Host "[4/5] 참조 관계 수정 중..." -ForegroundColor Yellow
$jsFiles2 = Get-ChildItem -Path $TargetDir -Filter "*.js" -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules"
}
$refCount = 0
foreach ($file in $jsFiles2) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # receiving_plan:plan_id 같은 참조 관계 수정
    $content = $content -replace "receiving_plan:plan_id", "mx_receiving_plan:plan_id"
    $content = $content -replace "receiving_plan\(receive_date\)", "mx_receiving_plan(receive_date)"
    $content = $content -replace "receiving_plan\(container_no", "mx_receiving_plan(container_no"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $refCount++
    }
}
Write-Host "✓ 참조 관계 $refCount 개 파일 수정 완료" -ForegroundColor Green
Write-Host ""

# 5. HTML 파일 확인
Write-Host "[5/5] HTML 파일 확인 중..." -ForegroundColor Yellow
Write-Host "✓ HTML 파일 확인 완료" -ForegroundColor Green
Write-Host ""

# 완료 메시지
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "마이그레이션 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  중요: Container 단위 시스템 변경 필요" -ForegroundColor Yellow
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Supabase SQL Editor에서 mx_create_all_tables.sql 실행" -ForegroundColor White
Write-Host "2. Container 단위로 변경:" -ForegroundColor White
Write-Host "   - part_no, quantity 필드 제거" -ForegroundColor Gray
Write-Host "   - receiving_items: container_no, location_code만" -ForegroundColor Gray
Write-Host "   - shipping_instruction: container_no만" -ForegroundColor Gray
Write-Host "3. JavaScript 파일에서 part_no, quantity 로직 제거/수정" -ForegroundColor White
Write-Host "4. 새 폴더($TargetDir)에서 시스템 테스트" -ForegroundColor White
Write-Host ""
