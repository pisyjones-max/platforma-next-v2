set -e
cd /var/www/platforma-next-v2
SECRET=$(node -e "
process.env.NODE_ENV='production'
require('dotenv').config({path:'.env.local'})
const {createHash}=require('crypto')
const t=process.env.TG_TOKEN||''
console.log(process.env.TG_WEBHOOK_SECRET || createHash('sha256').update(t+':chat-webhook').digest('hex').slice(0,32))
" 2>/tmp/node.err || cat /tmp/node.err)
echo "secret len: ${#SECRET}"

SID="dbgtest$(date +%s | tail -c5)"
echo "sid=$SID"

curl -s -X POST http://127.0.0.1:3000/api/chat/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: $SECRET" \
  -d "{\"update_id\":999001,\"message\":{\"date\":$(date +%s),\"text\":\"Сессия: $SID тестовый ответ от скрипта\",\"chat\":{\"id\":1}}}" \
  -w "\nwebhook http=%{http_code}\n"

sleep 1
echo "poll:"
curl -s "http://127.0.0.1:3000/api/chat/poll?sessionId=$SID&lastId=0"
echo
