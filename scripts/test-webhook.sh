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

TOKEN=$(grep -E '^TG_TOKEN=' .env.local | head -1 | cut -d= -f2-)
echo "--- getWebhookInfo:"
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo" | cut -c1-800; echo

echo "--- nginx access for /api/chat/webhook (last 20):"
grep -h "chat/webhook" /var/log/nginx/*access*.log 2>/dev/null | tail -20 | cut -c1-220
echo "--- (none found above means Telegram never reached nginx)"

echo "--- real chat: keys sample:"
node -e "
const fs=require('fs')
const env={}
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m=line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]]=m[2]
}
const url=env.KV_REST_API_URL||env.UPSTASH_REDIS_REST_URL
const tok=env.KV_REST_API_TOKEN||env.UPSTASH_REDIS_REST_TOKEN
if(!url){console.log('KV not configured');process.exit(0)}
fetch(url+'/keys/chat:*', {headers:{Authorization:'Bearer '+tok}})
  .then(r=>r.json()).then(d=>console.log(JSON.stringify(d).slice(0,600)))
  .catch(e=>console.log('err',String(e)))
"
