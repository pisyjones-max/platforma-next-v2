# ТОЛЬКО ЧТЕНИЕ. Диагностика: что происходит на сервере около 01:10
echo "== date/tz/uptime"; date; timedatectl 2>/dev/null | grep -E "Time zone|Local time"; uptime
echo "== crontab root"; crontab -l 2>&1 | grep -v "^#" | sed -E "s/(Bearer )[A-Za-z0-9._-]+/\1***/g; s/(key=|token=|KEY=)[^ &]+/\1***/gI"
echo "== /etc/cron.d + daily"; ls /etc/cron.d /etc/cron.daily 2>&1 | head -30
echo "== systemd timers"; systemctl list-timers --all --no-pager 2>&1 | head -25
echo "== ближайшие syslog 01:00-01:20 (последние сутки)"; 
for f in /var/log/syslog /var/log/syslog.1; do [ -f $f ] && grep -E "^[A-Z][a-z]{2} +[0-9]+ 01:(0[5-9]|1[0-9]|2[0-5])" $f 2>/dev/null | grep -vE "sshd|pam_unix|CRON.*session" | tail -25 | cut -c1-200; done
echo "== cron logs 01:xx"; grep -hE " 01:[0-2][0-9]:" /var/log/syslog /var/log/syslog.1 2>/dev/null | grep CRON | tail -10 | cut -c1-200
echo "== pm2"; pm2 status 2>&1 | cut -c1-130
echo "== pm2 platforma: ошибки/рестарты около 01:10"; grep -hE "T01:(0[5-9]|1[0-9]|2[0-5])" ~/.pm2/logs/platforma-*.log 2>/dev/null | tail -15 | cut -c1-200
echo "== память/диск"; free -m | sed -n 2p; df -h / | tail -1
echo "== OOM kills"; dmesg -T 2>/dev/null | grep -iE "out of memory|killed process" | tail -5 | cut -c1-200
echo "== relay доступность"; B=$(grep -E '^TG_API_BASE=' /var/www/platforma-next-v2/.env.local | cut -d= -f2- | sed 's#/*$##'); echo "relay host: $(echo $B | sed -E 's#https?://([^/]+).*#\1#')"; curl -s -o /dev/null -m 15 -w "relay http=%{http_code} t=%{time_total}s\n" "$B/" 
