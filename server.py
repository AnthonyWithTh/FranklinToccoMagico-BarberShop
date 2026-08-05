import http.server
import socketserver
import os
import json
import base64
from urllib.parse import urlparse, parse_qs

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/list-images':
            try:
                params = parse_qs(parsed.query)
                folder = params.get('folder', ['servizi'])[0]
                if folder not in ['servizi', 'barbieri']:
                    folder = 'servizi'
                
                images = []
                target_dir = os.path.join(DIRECTORY, 'assets', 'images', folder)
                if os.path.exists(target_dir):
                    for root, dirs, files in os.walk(target_dir):
                        for f in files:
                            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg')):
                                full_path = os.path.join(root, f)
                                rel_path = os.path.relpath(full_path, DIRECTORY).replace('\\', '/')
                                images.append(rel_path)
                images.sort()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'images': images}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
                return
        
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/upload':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                filename = data.get('filename')
                base64_data = data.get('data')
                folder = data.get('folder', 'servizi')
                if folder not in ['servizi', 'barbieri']:
                    folder = 'servizi'
                
                if filename and base64_data:
                    if ',' in base64_data:
                        header, base64_data = base64_data.split(',', 1)
                    
                    file_bytes = base64.b64decode(base64_data)
                    
                    target_dir = os.path.join(DIRECTORY, 'assets', 'images', folder)
                    os.makedirs(target_dir, exist_ok=True)
                    
                    target_path = os.path.join(target_dir, filename)
                    with open(target_path, 'wb') as f:
                        f.write(file_bytes)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    response = {'status': 'success', 'path': f'assets/images/{folder}/{filename}'}
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'status': 'error', 'message': str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        self.send_error(404, "Not Found")

print(f"Serving HTTP with upload & list-images support on port {PORT}...")
with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    httpd.serve_forever()
