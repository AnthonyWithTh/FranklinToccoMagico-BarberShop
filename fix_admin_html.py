import glob

files = glob.glob('admin/*.html')
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if '@supabase' not in content:
        content = content.replace('<script src="../js/storage.js', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n    <script src="../js/storage.js')
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")
print("Done!")
