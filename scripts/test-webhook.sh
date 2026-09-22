set -e
cd /var/www/platforma-next-v2
SECRET=$(node -e "
const fs=require('fs')
const env={}
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m=line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]]=m[2]
}
const {createHash}=require('crypto')
const t=env.TG_TOKEN||''
process.stdout.write(env.TG_WEBHOOK_SECRET || createHash('sha256').update(t+':chat-webhook').digest('hex').slice(0,32))
")
echo "secret len: ${#SECRET}"

SID="dbgtest$(date +%s | tail -c5)"
echo "sid=$SID"

curl -s -X POST http://127.0.0.1:3000/api/chat/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: $SECRET" \
  -d "{\"update_id\":999003,\"message\":{\"date\":$(date +%s),\"text\":\"$SID: тестовый ответ от скрипта\",\"chat\":{\"id\":1}}}" \
  -w "\nwebhook http=%{http_code}\n"

sleep 1
echo "poll:"
curl -s "http://127.0.0.1:3000/api/chat/poll?sessionId=$SID&lastId=0"
echo

echo "--- pm2 webhook-related logs:"
pm2 logs platforma --lines 60 --nostream 2>&1 | grep -i "\[CHAT\]" | tail -10
