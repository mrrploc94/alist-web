#!/usr/bin/env python3
"""Collect local AList metadata and the read-only Backuply SSH export.

No OAuth refreshes: those could rotate a token held by the live AList driver.
Unsupported provider quota stays null rather than being inferred from snapshots.
"""
import fcntl
import grp
import json
import os
import sqlite3
import subprocess
import tempfile
import time

DIRECTORY = '/var/lib/atp-alist-monitor'
KEY = '/root/.ssh/atp_backuply_monitor_ed25519'
KNOWN_HOSTS = '/root/.ssh/atp-backuply_known_hosts'

def collect():
    now = int(time.time())
    connection = sqlite3.connect('file:/www/wwwroot/file.atpwebhost.com/data/data.db?mode=ro',uri=True,timeout=8)
    connection.row_factory = sqlite3.Row
    storages = []
    for row in connection.execute('SELECT id,mount_path,driver,status,disabled FROM x_storages ORDER BY "order",id'):
        status = 'Đã tắt' if row['disabled'] else 'Hoạt động' if row['status']=='work' else 'Cần kiểm tra kết nối'
        storages.append({'id':row['id'],'mount_path':row['mount_path'],'driver':row['driver'],'status':status,'total_bytes':None,'used_bytes':None,'free_bytes':None,'quota_group':None,'quota_source':'unavailable'})
    result = {'schema_version':1,'updated_at':now,'storages':storages,'users':[],'schedules':[],'history':[],'totals':{'total_bytes':None,'used_bytes':None,'unknown_storages':len(storages),'active_jobs':0},'warnings':[],'sources':[]}
    # A forced command on iNet ignores client-supplied commands and only prints the allowlisted export.
    command=['ssh','-T','-i',KEY,'-o','BatchMode=yes','-o','ConnectTimeout=12','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+KNOWN_HOSTS,'-p','24700','root@103.72.97.92']
    try:
        process=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True,timeout=45)
        remote=json.loads(process.stdout)
        if process.returncode or remote.get('error') or remote.get('schema_version')!=1:
            raise ValueError('Remote export unavailable')
        for key in ['users','schedules','history']:
            result[key]=remote.get(key,[])
        result['totals']['active_jobs']=remote.get('active_jobs',0)
        result['warnings'].extend(remote.get('warnings',[]))
        result['sources'].append({'host':'SV92','updated_at':remote['updated_at'],'status':'ok'})
        if not remote.get('catalog_size_available'):
            result['warnings'].append('Catalog Backuply hiện không ghi dung lượng bản backup; cột dung lượng catalog được để chưa xác định.')
    except (OSError,ValueError,subprocess.TimeoutExpired):
        old_path=os.path.join(DIRECTORY,'dashboard.json')
        if os.path.exists(old_path):
            with open(old_path) as stream:
                old=json.load(stream)
            for key in ['users','schedules','history']:
                result[key]=old.get(key,[])
            result['sources']=old.get('sources',[])
        result['warnings'].append('Không đồng bộ được SV92. Dữ liệu Backuply cũ được giữ kèm thời điểm nguồn gần nhất.')
    result['warnings'].append('Driver AList hiện chưa cung cấp API quota dùng chung. Quota được để chưa xác định; không dùng token cloud ngoài cơ chế của AList.')
    gid=grp.getgrnam('www').gr_gid
    descriptor,temporary=tempfile.mkstemp(prefix='.dashboard-',dir=DIRECTORY)
    with os.fdopen(descriptor,'w') as stream:
        json.dump(result,stream,ensure_ascii=False)
    os.chmod(temporary,0o640);os.chown(temporary,0,gid)
    os.replace(temporary,os.path.join(DIRECTORY,'dashboard.json'))
    return {'storages':len(storages),'users':len(result['users']),'schedules':len(result['schedules']),'history':len(result['history']),'sources_ok':all(s.get('status')=='ok' for s in result['sources']) and bool(result['sources'])}

if __name__=='__main__':
    with open(os.path.join(DIRECTORY,'collector.lock'),'w') as lock:
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit(0)
        print(json.dumps(collect()))
