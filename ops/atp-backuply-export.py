#!/usr/bin/env python3
"""Read-only Backuply/DirectAdmin exporter. Invoked by an SSH forced command.

Only allowlisted metadata is returned; no remote credentials, task data, task
logs, private keys or backup content leave this host. Python 3.6 compatible.
"""
import datetime
import glob
import json
import os
import re
import sqlite3
import time

HOST = 'SV92'
NOW = int(time.time())

def db(name):
    connection = sqlite3.connect('file:/var/backuply/db/'+name+'.db?mode=ro', uri=True, timeout=8)
    connection.row_factory = sqlite3.Row
    return connection

def load(path, fallback):
    try:
        with open(path) as stream:
            return json.load(stream)
    except (IOError, ValueError):
        return fallback

def number(value):
    try:
        n = int(float(value))
        return n if n > 0 else None
    except (TypeError, ValueError, OverflowError):
        return None

def size(value):
    if value is None or str(value).strip() == '':
        return None
    match = re.match(r'^\s*([\d.]+)\s*([KMGT]?)(?:I?B)?\s*$', str(value).upper())
    if not match:
        return None
    return int(float(match.group(1)) * 1024 ** (' KMGT'.index(match.group(2)) if match.group(2) else 0))

def cron_match(part, current):
    for item in part.split(','):
        body, _, step = item.partition('/')
        step = int(step) if step else 1
        low, high = (0, 100) if body == '*' else tuple(map(int, body.split('-'))) if '-' in body else (int(body), int(body))
        if low <= current <= high and (current-low) % step == 0:
            return True
    return False

def next_cron(expression):
    pieces = expression.split()
    if len(pieces) != 5:
        return None
    try:
        for minute in range(1, 60*24*35):
            stamp = NOW//60*60+minute*60
            tm = time.localtime(stamp)
            dom = cron_match(pieces[2],tm.tm_mday)
            dow = cron_match(pieces[4],(tm.tm_wday+1)%7)
            day = (dom or dow) if pieces[2] != '*' and pieces[4] != '*' else dom and dow
            if cron_match(pieces[0],tm.tm_min) and cron_match(pieces[1],tm.tm_hour) and day and cron_match(pieces[3],tm.tm_mon):
                return stamp
    except (ValueError, ZeroDivisionError):
        pass
    return None

def export():
    warnings = []
    schedules = load('/var/backuply/conf/backup.json', [])
    servers = load('/var/backuply/conf/backup_servers.json', {})
    cron_lines = []
    try:
        with open('/etc/cron.d/backuply_admin_autobackups') as stream:
            cron_lines = [line.strip() for line in stream if line.strip() and not line.lstrip().startswith('#') and len(line.split()) >= 7]
    except IOError:
        warnings.append('Không đọc được cron Backuply trên SV92.')
    schedule_rows = []
    for schedule in schedules:
        sid = str(schedule.get('schedule_id', ''))
        matched = next((line for line in cron_lines if sid and sid in line), '')
        hourly = schedule.get('hourly_schedule') or {}
        expression = ' '.join(matched.split()[:5]) if matched else str(hourly.get('cron', ''))
        targets = re.findall(r'\d+', str(schedule.get('backup_server', '')))
        destination = ', '.join(str(servers.get(identifier, {}).get('name', identifier)) for identifier in targets)
        enabled = str(schedule.get('schedule_status')) == '1' and bool(matched)
        schedule_rows.append({'id': sid, 'name': str(schedule.get('backup_name', sid)), 'destination': destination, 'cron': expression or 'Chưa có cron', 'enabled': enabled, 'next_run': next_cron(expression) if enabled else None, 'created_at': None, 'retention': str(hourly.get('rotation_limit') or schedule.get('rotation_limit') or ''), 'source_timezone': time.tzname[0], 'method': schedule.get('backup_method', ''), 'scope': schedule.get('type', ''), 'filter_id': str(schedule.get('account_filters') or '')})
    catalog = list(db('backups').execute('SELECT user,created,size,backup_method FROM backups ORDER BY created DESC'))
    accounts = {}
    for folder in glob.glob('/usr/local/directadmin/data/users/*'):
        if not os.path.isdir(folder):
            continue
        user = os.path.basename(folder)
        source = None
        try:
            with open(os.path.join(folder, 'user.usage')) as stream:
                usage = dict(line.strip().split('=',1) for line in stream if '=' in line)
            value = usage.get('quota')
            if value is not None:
                source = int(float(value)*1024*1024)
        except (IOError, ValueError):
            pass
        accounts[user] = {'username': user, 'server': HOST, 'source_bytes': source, 'source_basis': 'DirectAdmin user.usage quota (MiB)', 'backup_bytes': None, 'last_backup': None, 'method': '', 'backup_count': 0, 'last_status': ''}
    for row in catalog:
        user = str(row['user'])
        account = accounts.setdefault(user, {'username':user,'server':HOST,'source_bytes':None,'backup_bytes':None,'last_backup':None,'method':'','backup_count':0,'last_status':''})
        account['backup_count'] += 1
        if account['last_backup'] is None:
            account.update(last_backup=number(row['created']), backup_bytes=size(row['size']), method=row['backup_method'])
    task_db = db('tasks')
    rows = task_db.execute("SELECT actid,user,action,status,status_txt,created,started,ended,data FROM tasks WHERE action LIKE 'creating_backup_%' OR action='admin_backup_master_process' ORDER BY actid DESC LIMIT 200")
    history = []
    for row in rows:
        user = row['action'][len('creating_backup_'):] if row['action'].startswith('creating_backup_') else 'Admin · Tổng tiến trình'
        started, ended = number(row['started']), number(row['ended'])
        state = int(row['status'] or 0)
        status = 'Cảnh báo' if state == -100 else 'Lỗi' if state < 0 else 'Hoàn tất' if ended else 'Đang chạy' if started else 'Đang chờ'
        # Use data solely to match a known schedule/method. Never serialize it.
        task_data = str(row['data'] or '')
        schedule = next((s for s in schedules if str(s.get('schedule_id','')) and str(s.get('schedule_id')) in task_data), {})
        method = schedule.get('backup_method') or ''
        if not method:
            match = re.search(r'backup_method.{0,12}"(incremental|compressed|uncompressed)"', task_data)
            method = match.group(1) if match else '—'
        # Status details are normalized rather than returning potentially sensitive logs.
        error = 'MySQL root connection failed' if 'mysql root connection failed' in str(row['status_txt']).lower() else 'Previous task still running' if 'previous task still running' in str(row['status_txt']).lower() else ''
        history.append({'id':row['actid'],'user':user,'server':HOST,'method':method,'status':status,'created':number(row['created']),'started':started,'ended':ended,'duration':max(0,ended-started) if started and ended else None,'error':error})
        if user in accounts and not accounts[user]['last_status']:
            accounts[user]['last_status'] = status
    active = task_db.execute("SELECT COUNT(*) FROM tasks WHERE (action LIKE 'creating_backup_%' OR action='admin_backup_master_process') AND (ended IS NULL OR ended=0) AND status>=0 AND created>?",(NOW-86400*7,)).fetchone()[0]
    return {'schema_version':1,'updated_at':NOW,'host':HOST,'timezone':time.tzname[0],'users':sorted(accounts.values(),key=lambda u:u['username']),'schedules':schedule_rows,'history':history,'active_jobs':active,'warnings':warnings,'catalog_size_available':any(size(r['size']) is not None for r in catalog)}

if __name__ == '__main__':
    try:
        # Forced-command SSH sessions may use the C locale on older hosts.
        print(json.dumps(export(), ensure_ascii=True))
    except Exception:
        print(json.dumps({'schema_version':1,'updated_at':NOW,'host':HOST,'error':'Không đọc được dữ liệu Backuply.','users':[],'schedules':[],'history':[],'active_jobs':0}))
        raise SystemExit(1)
