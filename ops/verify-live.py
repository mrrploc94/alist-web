#!/usr/bin/env python3
"""Small synthetic S3/share regression fixture; prints checks, never credentials."""
import base64,hashlib,importlib.util,json,os,pathlib,sqlite3,urllib.request,urllib.error,urllib.parse,uuid,sys
b=pathlib.Path(pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').read_text().strip())
statepath=b/'ui-probe-state.json'
prior=pathlib.Path(pathlib.Path('/root/atp-alist-upgrade-backups/current-path').read_text().strip())
spec=importlib.util.spec_from_file_location('s3probe',str(prior/'diagnose_alist_s3.py'));s3=importlib.util.module_from_spec(spec);spec.loader.exec_module(s3)
c=sqlite3.connect('file:/www/wwwroot/file.atpwebhost.com/data/data.db?mode=ro',uri=True);token=c.execute("select value from x_setting_items where key='token'").fetchone()[0];c.close()
def http(url,data=None,auth=False,form=False,headers=None):
 h=dict(headers or {})
 if auth:h['Authorization']=token
 if data is not None:
  data=(urllib.parse.urlencode(data) if form else json.dumps(data)).encode();h['Content-Type']='application/x-www-form-urlencoded' if form else 'application/json'
 try:
  with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=h),timeout=75) as r:return r.status,r.read()
 except urllib.error.HTTPError as r:return r.code,r.read()
def api(path,payload=None):
 status,body=http('http://127.0.0.1:5244/api'+path,payload,True);d=json.loads(body);assert d.get('code')==200,path+' API failed';return d.get('data')
def report(name,ok):
 state['checks'].append({'test':name,'ok':bool(ok)});save();print(json.dumps(state['checks'][-1]),flush=True);assert ok,name
def save():statepath.write_text(json.dumps(state,indent=2));os.chmod(statepath,0o600)
if len(sys.argv)>1 and sys.argv[1]=='cleanup':
 state=json.loads(statepath.read_text())
 for share in state.get('custom',[]):
  db=sqlite3.connect('/www/wwwroot/file.atpwebhost.com/share-app/db/shares.db');row=db.execute('select id from shares where share_id=? and note=?',(share['share_id'],state['marker'])).fetchone();db.close();assert row,'Marker-bound share fixture required';share['id']=row[0]
  _,body=http('https://file.atpwebhost.com/share-app/api.php?action=delete',{'id':share['id']},headers={'Authorization':'Bearer '+token});assert json.loads(body).get('code')==200
  # Remove only this synthetic, marker-bound row after exercising the normal revocation API.
  db=sqlite3.connect('/www/wwwroot/file.atpwebhost.com/share-app/db/shares.db');db.execute('delete from shares where id=? and note=?',(share['id'],state['marker']));db.commit();db.close()
 if state.get('native'):api('/share/delete',{'share_id':state['native']['share_id']})
 r=s3.request('DELETE','/backuply-yandex/'+state['key'],base='https://s3.atpweb.vn');assert r[0] in [200,204]
 state['cleaned']=True;save();print('Synthetic object and both share fixtures cleaned');sys.exit()
assert not statepath.exists() or '--resume' in sys.argv,'Fixture state already exists; inspect before retry'
marker='atp-ui-b-'+uuid.uuid4().hex;key='ATP-Backuply-S3-Test/'+marker+'.txt';body=('ATP workspace B verification '+marker+'\n').encode()
if statepath.exists():
 state=json.loads(statepath.read_text());marker=state['marker'];key=state['key'];body=('ATP workspace B verification '+marker+'\n').encode()
else:
 state={'marker':marker,'key':key,'path':'/Yandex/'+key,'checks':[],'custom':[],'native':None,'cleaned':False};save()
r=s3.request('PUT','/backuply-yandex/'+key,base='https://s3.atpweb.vn',body=body,extra={'content-md5':base64.b64encode(hashlib.md5(body).digest()).decode(),'content-type':'text/plain'});report('S3 PUT with Content-MD5',r[0]==200)
r=s3.request('HEAD','/backuply-yandex/'+key,base='https://s3.atpweb.vn');report('S3 HEAD',r[0]==200)
r=s3.request('GET','/backuply-yandex/'+key,base='https://s3.atpweb.vn');report('S3 GET exact bytes',r[0]==200 and r[2]==body)
r=s3.request('GET','/backuply-yandex/'+key,base='https://s3.atpweb.vn',extra={'range':'bytes=5-16'});report('S3 range exact bytes',r[0]==206 and r[2]==body[5:17])
native=api('/share/create',{'path':state['path'],'share_id':marker[-28:],'name':'ATP UI verification','allow_preview':True,'allow_download':True,'access_limit':0});state['native']=native;save()
status,html=http('https://file.atpwebhost.com/s/'+native['share_id']);report('Native share reaches AList through preserved /s route',status==200 and b'assets/' in html and b'token is invalid' not in html.lower())
password='UI-'+uuid.uuid4().hex;state['test_password']=password;save()
status,raw=http('https://file.atpwebhost.com/share-app/api.php?action=create',{'file_path':state['path'],'expires_days':1,'password':password,'max_downloads':4,'note':marker},headers={'Authorization':'Bearer '+token});d=json.loads(raw);report('Custom protected share creation',status==200 and d.get('code')==200);state['custom'].append(d['data']);save();url=d['data']['share_url']
status,html=http(url);report('Custom password screen preserved',status==200 and b'type="password"' in html)
status,html=http(url,{'password':'wrong-ui-test'},form=True);report('Custom wrong password refused','Mật khẩu không đúng'.encode() in html)
status,download=http(url+'?action=download',{'password':password},form=True);report('Custom correct password download exact bytes',status==200 and download==body)
print(json.dumps({'fixture':state['marker'],'folder':'/Yandex/ATP-Backuply-S3-Test','native_path':'/s/'+native['share_id'],'state':str(statepath)}))
