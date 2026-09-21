cd /var/www/platforma-next-v2
echo "== ps"; ps aux | grep -E "next build|npm ci|npm run" | grep -v grep | cut -c1-150
pkill -f "[n]ext build"; pkill -f "[n]pm ci"; sleep 2
exec 9>/tmp/platforma-deploy.lock
flock -w 1800 9
echo "== mem/disk"; free -m | sed -n 2p; df -h / | tail -1
echo "== git"; git status --short | head -5; git pull origin main 2>&1 | tail -3
echo "== deps"
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/next ]; then
  npm ci 2>&1 | tail -3
fi
sha256sum package-lock.json | cut -c1-64 > .npm-lock-hash
echo "== build"
NEXT_PUBLIC_SITE_URL="https://platforma-msk.ru" NODE_OPTIONS="--max-old-space-size=1536" npm run build 2>&1 | tail -25
echo "== admin key"
touch .env.local
if ! grep -qE '^ADMIN_KEY=.+' .env.local; then
  grep -v '^ADMIN_KEY=' .env.local > .env.tmp; mv .env.tmp .env.local
  echo "ADMIN_KEY=$(openssl rand -hex 24)" >> .env.local
  echo "created (value hidden)"
else
  echo "exists"
fi
echo "== pm2"
pm2 restart platforma --update-env >/dev/null 2>&1 || pm2 start npm --name platforma -- start >/dev/null 2>&1
sleep 15
pm2 status | cut -c1-120
pm2 logs platforma --lines 40 --nostream 2>&1 | grep -iE "error|cannot find|enoent|eaddr|ready" | tail -8 | cut -c1-200
KEY=$(grep -E '^ADMIN_KEY=' .env.local | head -1 | cut -d= -f2-)
echo "== site"; curl -s -o /dev/null -w "%{http_code}\n" https://platforma-msk.ru/
echo "== webhook"; curl -s "https://platforma-msk.ru/api/admin/tg-webhook?key=$KEY" | cut -c1-600; echo
