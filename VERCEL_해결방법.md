# Vercel 배포 문제 해결 방법

## 현재 문제
- Git 커밋 작성자("Your Name", "MLeehwa")가 Vercel에서 인식되지 않음
- "Deployment request did not have a git author with contributing access" 오류

## 해결 방법 (3가지)

### 방법 1: Vercel 프로젝트 재연결 (가장 간단) ⭐

**1단계: Vercel 대시보드 접속**
- https://vercel.com/leehwas-projects/lhw-wp1/settings/git

**2단계: GitHub 저장소 연결 해제**
- "Disconnect" 버튼 클릭
- 확인 메시지에서 "Disconnect" 확인

**3단계: GitHub 저장소 다시 연결**
- "Connect Git Repository" 버튼 클릭
- `Mikepark0720/LHSWP1` 선택
- 권한 확인 및 승인

**4단계: 배포 테스트**
- Deployments 탭으로 이동
- "Create Deployment" 클릭
- Branch: `main` 선택
- "Deploy" 클릭

---

### 방법 2: Vercel 프로젝트 새로 만들기

**1단계: 기존 프로젝트 삭제 (선택사항)**
- Vercel 대시보드에서 프로젝트 삭제
- 또는 그냥 새 프로젝트 생성

**2단계: 새 프로젝트 생성**
- Vercel 대시보드 → "Add New Project"
- GitHub 저장소: `Mikepark0720/LHSWP1` 선택
- 프로젝트 이름: `lhw-wp1` (또는 원하는 이름)
- Framework Preset: "Other" 선택
- Root Directory: `.` (기본값)
- Build Command: 비워두기
- Output Directory: `.` (기본값)
- Install Command: 비워두기

**3단계: 배포 확인**
- 자동으로 배포가 시작됨

---

### 방법 3: Vercel CLI로 직접 배포 (권한 우회)

**1단계: Vercel CLI로 배포**
```bash
vercel --prod --yes
```

**2단계: 자동 배포 비활성화 후 CLI만 사용**
- Vercel 대시보드에서 GitHub 연결 유지
- 필요할 때만 CLI로 배포

---

### 방법 4: Git 원격 저장소 확인 및 변경 (필요시)

**현재 원격 저장소 확인:**
```bash
git remote -v
```

**원격 저장소 변경 (필요시):**
```bash
git remote set-url origin https://github.com/Mikepark0720/LHSWP1.git
```

**또는 SSH 사용:**
```bash
git remote set-url origin git@github.com:Mikepark0720/LHSWP1.git
```

---

## 추천 순서

1. **먼저 방법 1 시도** (Vercel에서 GitHub 재연결) - 가장 간단
2. 안 되면 **방법 2 시도** (새 프로젝트 생성)
3. 그래도 안 되면 **방법 3 사용** (CLI로 직접 배포)

## 참고사항

- 방법 1과 2는 Vercel 대시보드에서만 가능
- 방법 3은 로컬에서 CLI로 실행
- 방법 4는 Git 설정 문제가 있을 때만 필요
