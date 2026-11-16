#!/usr/bin/env python3
"""Forward the public HTTPS scheme so native AList share assets avoid mixed content."""
import pathlib,subprocess
p=pathlib.Path('/www/server/panel/vhost/nginx/proxy/file.atpwebhost.com/8c7dd922ad47494fc02c388e12c00eac_file.atpwebhost.com.conf')
b=pathlib.Path(pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').read_text().strip())
old=p.read_bytes();needle=b'    proxy_set_header Host $host;'
assert old.count(needle)==1 and b'proxy_set_header X-Forwarded-Proto' not in old
(b/'proxy.conf').write_bytes(old)
p.write_bytes(old.replace(needle,needle+b'\n    proxy_set_header X-Forwarded-Proto $scheme;'))
try:
 subprocess.run(['/www/server/nginx/sbin/nginx','-t'],check=True)
 subprocess.run(['/www/server/nginx/sbin/nginx','-s','reload'],check=True)
except Exception:p.write_bytes(old);raise
print('HTTPS scheme forwarding enabled for file UI; separate S3 vhost unchanged.')
