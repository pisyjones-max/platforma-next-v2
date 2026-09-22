set -e
cd /var/www/platforma-next-v2
git pull origin main
pm2 delete tg-poller 2>/dev/null || true
pm2 start scripts/tg-poller.js --name tg-poller --time
pm2 save
sleep 8
echo "--- pm2 status:"
pm2 status | cut -c1-140
echo "--- tg-poller logs:"
pm2 logs tg-poller --lines 25 --nostream 2>&1 | cut -c1-250
