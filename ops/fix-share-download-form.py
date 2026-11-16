#!/usr/bin/env python3
"""Keep the entered password in a POST body when the recipient clicks Download."""
import pathlib,subprocess
p=pathlib.Path('/www/wwwroot/file.atpwebhost.com/share-app/download.php');old=p.read_text()
needle='''            <a href="<?= $downloadUrl ?>" class="btn-download" id="downloadBtn">
                <span class="material-symbols-outlined">download</span>
                Tải xuống
            </a>'''
assert old.count(needle)==1 and 'share-download-form' not in old
replacement='''            <?php if ($passwordVerified): ?>
            <form method="POST" action="<?= htmlspecialchars($downloadUrl, ENT_QUOTES, 'UTF-8') ?>" class="share-download-form">
                <input type="hidden" name="password" value="<?= htmlspecialchars($_POST['password'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                <button type="submit" class="btn-download" id="downloadBtn">
                    <span class="material-symbols-outlined">download</span>
                    Tải xuống
                </button>
            </form>
            <?php else: ?>
'''+needle+'''
            <?php endif; ?>'''
new=old.replace(needle,replacement)
assert new.split('function outputHead')[0]==old.split('function outputHead')[0]
try:
 p.write_text(new)
 subprocess.run(['/www/server/php/82/bin/php','-n','-l',str(p)],check=True)
except Exception:p.write_text(old);raise
print('Download CTA preserves the existing password check using POST; no password added to URLs.')
