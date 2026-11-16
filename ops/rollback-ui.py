#!/usr/bin/env python3
"""Restore only UI configuration and routing; never restore active user/database data."""
import pathlib,subprocess,sys
b=pathlib.Path(sys.argv[1]).resolve()
assert b.parent==pathlib.Path('/root/atp-alist-ui-backups') and (b/'config.json').is_file()
root=pathlib.Path('/www/wwwroot/file.atpwebhost.com')
if (b/'share-inject.js').is_file():(root/'share-app/share-inject.js').write_bytes((b/'share-inject.js').read_bytes())
(root/'data/config.json').write_bytes((b/'config.json').read_bytes())
if (b/'download.php').is_file():(root/'share-app/download.php').write_bytes((b/'download.php').read_bytes())
pathlib.Path('/www/server/panel/vhost/nginx/extension/file.atpwebhost.com/share_app.conf').write_bytes((b/'share_app.conf').read_bytes())
if (b/'proxy.conf').is_file():pathlib.Path('/www/server/panel/vhost/nginx/proxy/file.atpwebhost.com/8c7dd922ad47494fc02c388e12c00eac_file.atpwebhost.com.conf').write_bytes((b/'proxy.conf').read_bytes())
subprocess.run(['/www/server/nginx/sbin/nginx','-t'],check=True)
subprocess.run(['/www/server/nginx/sbin/nginx','-s','reload'],check=True)
subprocess.run(['docker','restart','alist'],check=True)
print('Restored UI and route configuration; user and storage data retained.')
