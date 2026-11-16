#!/usr/bin/env python3
"""Keep sidecar /s links and pass unowned IDs to native AList sharing."""
import pathlib,subprocess
root=pathlib.Path('/www/wwwroot/file.atpwebhost.com')
b=pathlib.Path(pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').read_text().strip())
p=root/'share-app/download.php'; old=p.read_bytes()
needle=b"if (!$share) {\n    showError"
assert old.count(needle)==1,'Unexpected live sidecar version'
(b/'download.php').write_bytes(old)
nginx=pathlib.Path('/www/server/panel/vhost/nginx/extension/file.atpwebhost.com/share_app.conf')
nold=nginx.read_bytes()
insert=b'''if (!$share) {
    // ATP: sidecar owns its existing IDs; native AList owns the remaining /s/ routes.
    $nativePath = substr($path, 3);
    if (preg_match('/[\\r\\n]/', $nativePath)) { http_response_code(400); exit; }
    $nativeQuery = $_SERVER['QUERY_STRING'] ?? '';
    header('X-Accel-Redirect: /_atp_native_share/' . $nativePath . ($nativeQuery !== '' ? '?' . $nativeQuery : ''));
    exit;
    showError'''
p.write_bytes(old.replace(needle,insert))
location=b'''
# Native AList shares behind the existing sidecar lookup. Internal-only handoff.
location ^~ /_atp_native_share/ {
    internal;
    proxy_pass http://127.0.0.1:5244/s/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
'''
assert b'location ^~ /_atp_native_share/' not in nold
try:
 nginx.write_bytes(nold+location)
 subprocess.run(['/www/server/php/82/bin/php','-n','-l',str(p)],check=True)
 subprocess.run(['/www/server/nginx/sbin/nginx','-t'],check=True)
 subprocess.run(['/www/server/nginx/sbin/nginx','-s','reload'],check=True)
except Exception:
 p.write_bytes(old);nginx.write_bytes(nold);raise
print('Native and custom share route dispatch installed; original sidecar handlers retained.')
