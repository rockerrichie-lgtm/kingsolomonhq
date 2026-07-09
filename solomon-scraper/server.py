"""
Solomon Scraper — Local trigger server
Run this once in the background: py server.py
Then click "Run Scraper" in the admin panel to trigger a scrape.
Listens on http://localhost:5001
"""

from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import threading
import os
import sys

app = Flask(__name__)
CORS(app)  # Allow requests from kingsolomonhq.com

scraper_running = False
scraper_log = []

def run_scraper_thread():
    global scraper_running, scraper_log
    scraper_running = True
    scraper_log = []
    try:
        scraper_path = os.path.join(os.path.dirname(__file__), "scraper.py")
        process = subprocess.Popen(
            [sys.executable, scraper_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        for line in process.stdout:
            line = line.rstrip()
            scraper_log.append(line)
            print(line)
        process.wait()
    except Exception as e:
        scraper_log.append(f"Error: {e}")
        print(f"Error: {e}")
    finally:
        scraper_running = False

@app.route('/trigger', methods=['POST'])
def trigger():
    global scraper_running
    if scraper_running:
        return jsonify({"status": "already_running", "message": "Scraper is already running."})
    thread = threading.Thread(target=run_scraper_thread)
    thread.daemon = True
    thread.start()
    return jsonify({"status": "started", "message": "Scraper started."})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "running" if scraper_running else "idle",
        "log": scraper_log[-20:] if scraper_log else []
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Solomon scraper server is running."})

if __name__ == '__main__':
    print("Solomon Scraper Server starting...")
    print("Listening on http://localhost:5001")
    print("Keep this running in the background.")
    print("Click Run Scraper in admin panel to trigger.")
    app.run(host='0.0.0.0', port=5001, debug=False)