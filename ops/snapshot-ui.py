#!/usr/bin/env python3
"""Snapshot the existing service before switching the supported external UI directory."""
import datetime,hashlib,json,pathlib,sqlite3,subprocess,tarfile,os
ROOT=pathlib.Path('/www/wwwroot/file.atpwebhost.com')
stamp=datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
backup=pathlib.Path('/root/atp-alist-ui-backups')/stamp
backup.mkdir(mode=0o700,parents=True)
os.umask(0o077)
(backup/'config.json').write_bytes((ROOT/'data/config.json').read_bytes())
source=sqlite3.connect('file:'+str(ROOT/'data/data.db')+'?mode=ro',uri=True)
source.backup(sqlite3.connect(str(backup/'alist.db')))
with tarfile.open(str(backup/'sidecar.tar.gz'),'w:gz') as t:t.add(str(ROOT/'share-app'),arcname='share-app')
nginx=pathlib.Path('/www/server/panel/vhost/nginx/extension/file.atpwebhost.com/share_app.conf')
(backup/'share_app.conf').write_bytes(nginx.read_bytes())
(backup/'nginx-main.conf').write_bytes(pathlib.Path('/www/server/panel/vhost/nginx/file.atpwebhost.com.conf').read_bytes())
(backup/'container.json').write_bytes(subprocess.check_output(['docker','inspect','alist']))
hashes={str(p.relative_to(ROOT/'share-app')):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'share-app').rglob('*') if p.is_file()}
(backup/'sidecar-hashes.json').write_text(json.dumps(hashes,indent=2))
def table_hash(name):
 rows=source.execute('select * from '+name+' order by id').fetchall()
 return {'rows':len(rows),'sha256':hashlib.sha256(json.dumps(rows,default=str,sort_keys=True).encode()).hexdigest()}
(backup/'data-integrity.json').write_text(json.dumps({n:table_hash(n) for n in ['x_storages','x_users','x_roles','x_meta']},indent=2))
pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').write_text(str(backup))
print(json.dumps({'backup':str(backup),'sidecar_files':len(hashes),'database_backup':True}))
