import os
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

# Load dotenv-like manually to read .env
env_vars = {}
try:
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()
except Exception:
    pass

GEMINI_API_KEY = env_vars.get('GEMINI_API_KEY') or os.environ.get('GEMINI_API_KEY')
PORT = int(env_vars.get('PORT') or os.environ.get('PORT') or 5000)

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured in .env or environment!")

class FutureMeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        # Override to serve frontend files statically
        # If accessing the root, serve index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # If it's a file request and starts with /api, let POST handle it
        if self.path.startswith('/api/'):
            self.send_error(405, "Method not allowed")
            return
            
        # The frontend folder is one level up from backend
        # We need to serve from '../frontend' directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_dir = os.path.abspath(os.path.join(current_dir, '../frontend'))
        
        # Resolve target file path
        target_path = os.path.abspath(os.path.join(frontend_dir, self.path.lstrip('/')))
        if not target_path.startswith(frontend_dir):
            self.send_error(403, "Forbidden")
            return
            
        if os.path.exists(target_path) and os.path.isfile(target_path):
            self.send_response(200)
            # Send proper content type
            if target_path.endswith('.html'):
                self.send_header('Content-Type', 'text/html')
            elif target_path.endswith('.css'):
                self.send_header('Content-Type', 'text/css')
            elif target_path.endswith('.js'):
                self.send_header('Content-Type', 'application/javascript')
            self.end_headers()
            with open(target_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            # Fall back to index.html for single page app routing
            fallback_path = os.path.join(frontend_dir, 'index.html')
            if os.path.exists(fallback_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                with open(fallback_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found")

    def do_POST(self):
        if self.path == '/api/generate-futureme':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))
            
            name = req_body.get('name')
            age = req_body.get('age')
            goal = req_body.get('goal')
            struggle = req_body.get('struggle')
            one_year_vision = req_body.get('oneYearVision')
            tone = req_body.get('tone')
            
            if not all([name, age, goal, struggle, one_year_vision, tone]):
                self.send_json_response(400, {
                    "success": False,
                    "error": "Missing coordinates. Please fill all fields."
                })
                return
                
            if not GEMINI_API_KEY:
                self.send_json_response(500, {
                    "success": False,
                    "error": "Gemini API key is not configured in the backend (.env)"
                })
                return
                
            # Construct the prompt
            system_prompt = f"""You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: {tone}

User details:
Name: {name}
Age: {age}
Goal: {goal}
Current struggle: {struggle}
One-year vision: {one_year_vision}

Return only valid JSON in this exact format:
{{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical."""

            # Call Gemini via direct HTTPS request
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [{"text": system_prompt}]
                    }],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    text = res_body['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    if text.startswith('```'):
                        text = text.replace('```json', '', 1).replace('```', '', 1).strip()
                        
                    parsed_data = json.loads(text)
                    self.send_json_response(200, {
                        "success": True,
                        "data": parsed_data
                    })
            except urllib.error.HTTPError as e:
                err_text = e.read().decode('utf-8')
                print("Gemini API HTTP Error:", err_text)
                self.send_json_response(500, {
                    "success": False,
                    "error": f"Gemini API error. Try again."
                })
            except Exception as e:
                print("Gemini API general error:", str(e))
                self.send_json_response(500, {
                    "success": False,
                    "error": "FutureMe could not respond right now. Try again."
                })
                
        elif self.path == '/api/chat-futureme':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))
            
            user_profile = req_body.get('userProfile')
            chat_history = req_body.get('chatHistory')
            question = req_body.get('question')
            
            if not user_profile or not question:
                self.send_json_response(400, {
                    "success": False,
                    "error": "Missing user profile or question."
                })
                return
                
            if not GEMINI_API_KEY:
                self.send_json_response(500, {
                    "success": False,
                    "error": "Gemini API key is not configured in the backend (.env)"
                })
                return
                
            history_str = ""
            if chat_history:
                history_str = "\n".join([f"{'User' if h['role'] == 'user' else 'FutureMe'}: {h['message']}" for h in chat_history])
            else:
                history_str = "No chat history yet."
                
            chat_prompt = f"""You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: {user_profile.get('name')}
Age: {user_profile.get('age')}
Goal: {user_profile.get('goal')}
Struggle: {user_profile.get('struggle')}
One-year vision: {user_profile.get('oneYearVision')}
Tone: {user_profile.get('tone')}

Recent chat history:
{history_str}

Current question:
{question}

Reply in 2-5 short paragraphs. Give at least one clear action."""

            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [{"text": chat_prompt}]
                    }]
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    reply = res_body['candidates'][0]['content']['parts'][0]['text'].strip()
                    self.send_json_response(200, {
                        "success": True,
                        "reply": reply
                    })
            except Exception as e:
                print("Gemini chat error:", str(e))
                self.send_json_response(500, {
                    "success": False,
                    "error": "FutureMe could not respond right now."
                })
        else:
            self.send_error(404, "Endpoint not found")

    def send_json_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def run():
    print(f"==================================================")
    print(f"Starting Python-based Fallback Server...")
    print(f"Server is listening on Port {PORT}")
    print(f"Access the premium web app at http://localhost:{PORT}")
    print(f"==================================================")
    
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, FutureMeHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    run()
