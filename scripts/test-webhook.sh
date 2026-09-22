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

TOKEN=$(grep -E '^TG_TOKEN=' .env.local | head -1 | cut -d= -f2-)
echo "--- getWebhookInfo (before):"
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo" | cut -c1-500; echo

echo "--- local nginx status:"
systemctl is-active nginx 2>&1 || true
ss -tlnp 2>/dev/null | grep -E ":443|:80" || true

echo "--- ufw / iptables (incoming rules, if any):"
(ufw status 2>&1 | head -20) || true
(iptables -L INPUT -n 2>&1 | head -20) || true

echo "--- fail2ban jails (if present):"
(fail2ban-client status 2>&1) || true

echo "--- KV keys via REST list:"
node -e "
const fs=require('fs')
const env={}
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m=line.match(/^([A-Z0-9_]+)=(.*)\$/)
  if (m) env[m[1]]=m[2]
}
const base=(env.KV_REST_API_URL||env.UPSTASH_REDIS_REST_URL||'').trim()
const tok=(env.KV_REST_API_TOKEN||env.UPSTASH_REDIS_REST_TOKEN||'').trim()
if(!base){console.log('KV not configured');process.exit(0)}
fetch(base+'/keys/chat:*', {headers:{Authorization:'Bearer '+tok}})
  .then(r=>r.json()).then(d=>console.log(JSON.stringify(d).slice(0,600)))
  .catch(e=>console.log('err',String(e)))
"
