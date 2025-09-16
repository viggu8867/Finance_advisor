from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/')
def hello_world():
    return jsonify(message="Hello from Flask backend!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
