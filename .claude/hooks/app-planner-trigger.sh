#!/bin/bash
# 앱 개발 키워드 감지 → /app-planner 자동 실행 안내
# UserPromptSubmit 이벤트에서 실행

USER_PROMPT="$CLAUDE_USER_PROMPT"

# 한국어 + 영어 키워드 매칭
if echo "$USER_PROMPT" | grep -qiE '앱 만들어|앱을 만들|앱 개발|앱 제작|앱을 개발|앱을 제작|새 앱|새로운 앱|build me|build an app|create an app|make an app|make me an app|I want an app|I want a app|new app|develop an app'; then
  echo "[App Planner] 앱 개발 요청이 감지되었습니다. /app-planner 스킬을 실행하여 체계적인 플래닝 인터뷰를 진행하세요."
fi
