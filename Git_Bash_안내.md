# Git Bash에서 Vercel 프로젝트 연결하기

## 현재 상황
- `vercel link` 실행 중
- "Leehwa's projects" 선택됨
- 프로젝트 목록에 기존 프로젝트가 없음

## 해결 방법

### 방법 1: 기존 프로젝트 이름으로 연결 시도

Git Bash에서:
1. "Link to existing project" 선택
2. 프로젝트 이름 입력: `lhw-wp1`
3. Enter

### 방법 2: 새 프로젝트 생성 (같은 이름)

Git Bash에서:
1. "Create a new project" 선택
2. 프로젝트 이름 입력: `lhw-wp1`
3. Enter
4. Framework: "Other" 선택
5. Root Directory: `.` (기본값)
6. Build Command: 비워두기
7. Output Directory: `.` (기본값)

**참고:** 같은 이름으로 생성하면 기존 URL을 유지할 수 있습니다.

### 방법 3: 취소하고 수동으로 설정

1. `Ctrl+C`로 취소
2. `.vercel/project.json` 파일이 이미 생성되어 있음
3. Vercel 대시보드에서 정확한 Org ID 확인 필요

## 다음 단계

연결이 완료되면:
```bash
vercel --prod --yes
```

이 명령으로 직접 배포할 수 있습니다 (Git 커밋 작성자 문제 우회).
