# Git 커밋 작성자 정보를 수정하는 PowerShell 스크립트
# 주의: 이 작업은 Git 히스토리를 재작성합니다.

Write-Host "Git 커밋 작성자 정보를 수정합니다..." -ForegroundColor Yellow
Write-Host "주의: 이 작업은 Git 히스토리를 재작성합니다." -ForegroundColor Red
Write-Host ""

# Git Bash 경로 확인
$gitBashPath = (Get-Command git).Source -replace '\\git.exe$', '\bin\bash.exe'

if (-not (Test-Path $gitBashPath)) {
    Write-Host "Git Bash를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "Git Bash를 수동으로 열고 다음 명령을 실행하세요:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "cd /c/Users/LHA-M/WP1" -ForegroundColor Cyan
    Write-Host "bash fix-all-authors.sh" -ForegroundColor Cyan
    exit 1
}

Write-Host "Git Bash를 사용하여 작성자 정보를 수정합니다..." -ForegroundColor Green

# Git Bash로 스크립트 실행
$scriptPath = Join-Path $PSScriptRoot "fix-all-authors.sh"
$bashCommand = "cd /c/Users/LHA-M/WP1 && bash fix-all-authors.sh"

& $gitBashPath -c $bashCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "작업이 완료되었습니다!" -ForegroundColor Green
    Write-Host "다음 명령으로 강제 푸시하세요:" -ForegroundColor Yellow
    Write-Host "git push origin main --force" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "오류가 발생했습니다. Git Bash를 수동으로 사용하세요." -ForegroundColor Red
}
