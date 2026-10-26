import os
import json
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_car_market'

DATA_FILE = os.path.join('database', 'cars.json')

def load_data():
    if not os.path.exists(DATA_FILE):
        os.makedirs('database', exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cars', methods=['GET'])
def get_cars():
    return jsonify(load_data())

@app.route('/api/cars', methods=['POST'])
def add_car():
    cars = load_data()
    new_car = request.json
    new_car['id'] = max([c['id'] for c in cars], default=0) + 1
    
    if len(cars) % 2 == 0:
        new_car['seller'] = 'Namazov Yunis'
        new_car['phone'] = '89998265757'
    else:
        new_car['seller'] = 'Marku Marius'
        new_car['phone'] = '89999226570'
        
    cars.append(new_car)
    save_data(cars)
    return jsonify(new_car), 201

@app.route('/api/cars/<int:car_id>', methods=['DELETE'])
def delete_car(car_id):
    cars = load_data()
    cars = [c for c in cars if c['id'] != car_id]
    save_data(cars)
    return jsonify({'status': 'success'})

@app.route('/api/auth', methods=['POST'])
def auth():
    data = request.json
    session['username'] = data.get('username', 'Guest')
    session['phone'] = data.get('phone', '')
    return jsonify({'status': 'success', 'username': session['username'], 'phone': session['phone']})

@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'username' in session:
        return jsonify({'logged': True, 'username': session['username'], 'phone': session['phone']})
    return jsonify({'logged': False})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
