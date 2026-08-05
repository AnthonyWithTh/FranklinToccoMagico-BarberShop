import os, glob
script_tag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'
files = glob.glob('*.html') + glob.glob('admin/*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if '@supabase/supabase-js' not in content:
        content = content.replace('<script src="js/storage.js"></script>', script_tag + '    <script src="js/storage.js"></script>')
        content = content.replace('<script src="../js/storage.js"></script>', script_tag + '    <script src="../js/storage.js"></script>')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
print('Supabase CDN injected into HTML files.')
