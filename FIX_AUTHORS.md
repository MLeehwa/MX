# Git 커밋 작성자 수정 가이드

## 문제 상황
- "Your Name"으로 된 커밋이 5개
- "MLeehwa"로 된 커밋이 24개
- Vercel이 이들을 인식하지 못함

## 해결 방법

### 방법 1: Git Bash 사용 (권장)

1. **Git Bash 열기**
   - 시작 메뉴에서 "Git Bash" 검색
   - 또는 프로젝트 폴더에서 우클릭 → "Git Bash Here"

2. **프로젝트 폴더로 이동**
   ```bash
   cd /c/Users/LHA-M/WP1
   ```

3. **스크립트 실행**
   ```bash
   bash fix-all-authors.sh
   ```

4. **강제 푸시**
   ```bash
   git push origin main --force
   ```

### 방법 2: 수동으로 명령 실행

Git Bash에서 다음 명령을 직접 실행:

```bash
git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_NAME" = "Your Name" ] || [ "$GIT_AUTHOR_NAME" = "MLeehwa" ]; then
    export GIT_AUTHOR_NAME="Mikepark0720"
    export GIT_AUTHOR_EMAIL="164405431+MLeehwa@users.noreply.github.com"
fi
if [ "$GIT_COMMITTER_NAME" = "Your Name" ] || [ "$GIT_COMMITTER_NAME" = "MLeehwa" ]; then
    export GIT_COMMITTER_NAME="Mikepark0720"
    export GIT_COMMITTER_EMAIL="164405431+MLeehwa@users.noreply.github.com"
fi
' --tag-name-filter cat -- --branches --tags

git push origin main --force
```

## 주의사항
- 이 작업은 Git 히스토리를 재작성합니다
- 강제 푸시가 필요합니다
- 다른 사람과 협업 중이라면 사전에 공유하세요
