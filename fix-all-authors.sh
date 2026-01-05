#!/bin/bash
# 모든 커밋의 작성자를 Mikepark0720으로 변경하는 스크립트

echo "Git 커밋 작성자 정보를 수정합니다..."
echo "주의: 이 작업은 Git 히스토리를 재작성합니다."

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

echo ""
echo "작업이 완료되었습니다!"
echo "다음 명령으로 강제 푸시하세요:"
echo "git push origin main --force"
