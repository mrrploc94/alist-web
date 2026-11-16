#!/usr/bin/env python3
"""Patch only presentation hooks in the canonical live sidecar; never copy config.php."""
import pathlib,re,subprocess
root=pathlib.Path('/www/wwwroot/file.atpwebhost.com/share-app')
backup=pathlib.Path(pathlib.Path('/root/atp-alist-ui-backups/deployment-backup-path').read_text().strip())
assert (backup/'download.php').is_file() and (backup/'share-inject.js').is_file()
page=root/'download.php';old=page.read_text();assert 'atp-share-public' not in old,'Presentation hooks already installed'
assert old.count('<body>')==3 and old.count('<div class="app-logo">ATP Web</div>')==3
new=old.replace('<body>','<body class="atp-share-public">')
brand='<a class="app-logo" href="<?= htmlspecialchars(ALIST_BASE_URL, ENT_QUOTES, \'UTF-8\') ?>"><img src="https://atpweb.vn/wp-content/uploads/2020/11/Logo-atpweb.png" alt="ATP Web" width="96" height="40"><span>Chia sẻ tệp</span></a>'
new=new.replace('<div class="app-logo">ATP Web</div>',brand)
new=new.replace('</style>','</style>\n<link rel="stylesheet" href="/share-app/share-workspace.css?v=20261116-exterior2">\n<script defer src="/share-app/share-workspace.js?v=20261116-exterior2"></script>',1)
new=re.sub(r'<div class="(file-name|error-title)">(.+?)</div>',r'<h1 class="\1">\2</h1>',new)
new=new.replace('<input type="password" name="password"','<label for="share-password">Mật khẩu truy cập</label>\n                <input id="share-password" autocomplete="current-password" type="password" name="password"')
new=new.replace('Tệp tin được lưu trữ an toàn bởi ATP Web','Liên kết được chia sẻ qua ATP Web')
new=new.replace('<span class="material-symbols-outlined"','<span aria-hidden="true" class="material-symbols-outlined"')
# The existing stream, expiry, password and download-limit handlers above outputHead are byte-identical.
assert new.split('function outputHead')[0]==old.split('function outputHead')[0]
inject=root/'share-inject.js';before=inject.read_text()
assert 'share-workspace.js' not in before,'Injector hook already installed'
hook="""\n// ATP exterior workspace: presentation only; keep the original Share logic above.
(function(){if(document.querySelector('script[data-atp-share-workspace]'))return;var s=document.createElement('script');s.src='/share-app/share-workspace.js?v=20261116-exterior2';s.dataset.atpShareWorkspace='';document.head.appendChild(s)})();\n"""
try:
 page.write_text(new);inject.write_text(before+hook)
 subprocess.run(['/www/server/php/82/bin/php','-n','-l',str(page)],check=True)
except Exception:
 page.write_text(old);inject.write_text(before);raise
print('Updated all public Share states and injector presentation hook; data handlers unchanged.')
