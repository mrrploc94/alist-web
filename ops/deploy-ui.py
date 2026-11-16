#!/usr/bin/env python3
"""Activate an external UI dist without changing the AList image or cloud configuration.
Run with Python 3.11 on Oracle after snapshot-ui.py and uploading the archive.
"""
import datetime,hashlib,json,os,pathlib,re,shutil,subprocess,tarfile,time,urllib.request
root=pathlib.Path('/www/wwwroot/file.atpwebhost.com')
backup=pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').read_text().strip()
assert pathlib.Path(backup,'data-integrity.json').is_file(), 'Complete snapshot required'
archive=pathlib.Path('/root/atp-alist-ui-workspace-b.tar.gz')
release='workspace-b-'+datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
folder=root/'data/ui-releases'/release
folder.mkdir(parents=True,mode=0o755)
with tarfile.open(archive,'r:gz') as t:
 for m in t.getmembers():
  p=pathlib.PurePosixPath(m.name)
  assert p.parts[0]=='dist' and '..' not in p.parts and not m.issym() and not m.islnk(), 'Unsafe archive member'
 for m in t.getmembers():
  dest=folder/m.name
  if m.isdir():dest.mkdir(parents=True,exist_ok=True,mode=0o755)
  elif m.isfile():
   dest.parent.mkdir(parents=True,exist_ok=True,mode=0o755);dest.write_bytes(t.extractfile(m).read());os.chmod(dest,0o644)
  else:raise ValueError('Unsupported archive member')
dist=folder/'dist'
assert (dist/'index.html').is_file()
for d in ['assets','images','streamer','static']:(dist/d).mkdir(exist_ok=True)
# Keep chunks referenced by existing open browser tabs. All downloads come from the old local UI.
origin='http://127.0.0.1:5244'
pending=[];seen=set();count=0
html=urllib.request.urlopen(origin+'/').read().decode('utf8')
pending += re.findall(r'(?:src|href)=[\"\']([^\"\']+\.(?:js|css))',html)
while pending and len(seen)<700:
 asset=pending.pop()
 if asset.startswith('./'):asset='/assets/'+asset[2:]
 if not asset.startswith('/assets/'):
  if '/' not in asset:asset='/assets/'+asset
  else:continue
 if asset in seen or '..' in asset:continue
 seen.add(asset)
 try:
  response=urllib.request.urlopen(origin+asset,timeout=15)
  body=response.read()
  if 'text/html' in response.headers.get('Content-Type',''):continue
  dest=dist/asset.lstrip('/')
  if not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(body);count+=1
  if asset.endswith(('.js','.css')):
   text=body.decode('utf8',errors='ignore')
   pending += re.findall(r'[\"\']((?:\./|/assets/)?[A-Za-z0-9_.-]+\.(?:js|css))[\"\']',text)
 except Exception:pass
config_path=root/'data/config.json'
old=config_path.read_bytes();config=json.loads(old)
config['dist_dir']='/opt/alist/data/ui-releases/'+release+'/dist'
temp=config_path.with_suffix('.json.atp-tmp');temp.write_text(json.dumps(config,indent=2,ensure_ascii=False)+'\n');os.chmod(temp,0o600);os.replace(temp,config_path)
try:
 subprocess.run(['docker','restart','alist'],check=True,stdout=subprocess.DEVNULL,timeout=90)
 ok=False
 for _ in range(40):
  try:
   data=json.load(urllib.request.urlopen(origin+'/api/public/settings',timeout=3))
   if data.get('code')==200:ok=True;break
  except Exception:pass
  time.sleep(1)
 assert ok,'Service failed health check'
 loaded=urllib.request.urlopen(origin+'/').read().decode('utf8')
 assert all(m in loaded for m in re.findall(r'assets/[^\"\'<> ]+\.js',(dist/'index.html').read_text())[:1]),'UI index differs'
except Exception:
 config_path.write_bytes(old);subprocess.run(['docker','restart','alist'],check=True,stdout=subprocess.DEVNULL)
 raise
pathlib.Path(backup,'release.json').write_text(json.dumps({'release':release,'container_dist':config['dist_dir'],'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'legacy_assets':count},indent=2))
print(json.dumps({'release':release,'backup':backup,'legacy_assets':count,'health':True,'image_unchanged':True}))
