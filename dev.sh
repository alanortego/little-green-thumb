#!/bin/bash
# Runs the backend and frontend dev servers in two new Terminal.app tabs.
# ponytail: osascript + Terminal.app tabs, no tmux/process-manager dep needed
# for a two-process local dev setup.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

open_tab() {
  local title="$1" cmd="$2"
  osascript <<EOF
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  delay 0.3
  do script "cd '$ROOT/$title' && printf '\\\\033]0;$title\\\\007' && source ~/.nvm/nvm.sh && nvm use 24 && $cmd" in front window
end tell
EOF
}

open_tab "backend" "npm run dev"
open_tab "frontend" "npm run dev"

echo "Started backend and frontend dev servers in new Terminal tabs."
