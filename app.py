from flask import Flask, render_template, send_from_directory, request, jsonify, session
import cv2
import numpy as np
from deepface import DeepFace
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key'

app.static_folder = 'static'
MUSIC_FOLDER = os.path.join(app.static_folder, 'music')
IMAGES_FOLDER = os.path.join(app.static_folder, 'images')
HISTORY_FILE = "user_emotion_history.json"
RATING_FILE = "rating_history.json"
USER_FILE = "users.json"

content = {
    "happy": {
        "music": ["happy1.mp3", "happy2.mp3", "happy3.mp3"],
        "color": "#FFD700",  # Gold
        "stories": {
            "en": [
                "Life is like a garden full of flowers. Every morning, as the sun rises, remind yourself that today is a new opportunity to be grateful. Just like the bees buzzing among the blossoms, tell yourself that you can bring beauty and sweetness to yourself and others with every step.",
                "In the smallest moments of joy, great miracles are hidden. Perhaps today, the simplest things will bring a smile to your face; the sound of birds, a gentle breeze, or a warm conversation. Cherish these small moments, for the greatest happiness is built upon them.",
                "Remember that joy springs from within, not from outside. Whenever you feel happy, remind yourself that this is a gift from you to yourself. You are the creator of happiness, and it's your power to bring color to the world."
            ],
            "fa": [
                "زندگی مثل یک باغ پر از گل است. هر روز صبح، وقتی خورشید طلوع می‌کند، به خود یادآوری کن که امروز فرصتی جدید برای شکرگزاری است. همانطور که زنبورها در میان گل‌ها می‌چرخند، به خود بگو که مانند آن‌ها می‌توانی با هر قدم، زیبایی و شیرینی زندگی را به خود و دیگران هدیه دهی.",
                "در دل لحظات کوچک شادی، معجزه‌های بزرگ پنهان است. شاید امروز ساده‌ترین چیزها لبخندی بر لبانت بنشاند؛ صدای پرنده‌ها، نسیم خنک یا یک گفتگوی گرم. این لحظات کوچک را قدر بدان، چرا که از آن‌ها بزرگ‌ترین شادی‌ها ساخته می‌شود.",
                "به یاد داشته باش که شادی از درون می‌جوشد، نه از بیرون. هر زمان که احساس خوشحالی می‌کنی، به خود بگو این هدیه‌ای از خودت برای خودت است. تو سازنده‌ی شادی هستی، و این قدرت تو است که به دنیا رنگ ببخشی."
            ]
        },
        "color": "#FFD700",
        "season": "spring"
    },
    "sad": {
        "music": ["sad1.mp3", "sad2.mp3", "sad3.mp3"],
        "color": "#00008B",  # Dark Blue
        "stories": {
            "en": [
                "Sadness is like a passing cloud; no cloud stays forever. Perhaps today, the rain of tears will fall, but with every drop, the sky of your heart becomes clearer. Wait for tomorrow's sun, because after every storm, a rainbow appears.",
                "Sorrows are a part of life's journey. They teach us how strong we truly are. Remind yourself that no matter how tough the path may seem, you are still moving forward. These sorrows shape you; they don't break you.",
                "Every dark night ends with a bright morning. Even if today you feel lost in the dark, remember that the light of hope always shines within your heart. You just need to listen to it and find your way."
            ],
            "fa": [
                "غم مثل یک ابر گذرا است؛ هیچ ابری برای همیشه باقی نمی‌ماند. شاید امروز باران اشک ببارد، اما هر قطره که می‌ریزد، آسمان قلبت روشن‌تر می‌شود. منتظر آفتاب فردا باش، چرا که همیشه بعد از طوفان، رنگین‌کمان می‌آید.",
                "غم‌ها بخشی از سفر زندگی هستند. آن‌ها به ما یاد می‌دهند که چقدر قوی هستیم. به خودت بگو که هر چقدر مسیر سخت باشد، تو همچنان در حرکت هستی. این غم‌ها تو را می‌سازند، نه می‌شکنند.",
                "هر شب تاریک، به صبحی روشن ختم می‌شود. حتی اگر امروز احساس کنی در تاریکی گم شده‌ای، به یاد داشته باش که نور امید همیشه در قلبت روشن است. کافی است که به آن گوش بدهی و راه خود را پیدا کنی."
            ]
        },
        "color": "#00008B",
        "season": "autumn"
    },
    "neutral": {
        "music": ["neutral1.mp3", "neutral2.mp3", "neutral3.mp3"],
        "color": "#808080",  # Gray
        "stories": {
            "en": [
                "Life is sometimes like a calm lake. You may not see much movement, but there's beauty in its stillness. Use these moments of silence to rebuild yourself. Calmness is your launchpad for exciting moments ahead.",
                "Feeling indifferent can be the start of discovering something new. When the world feels simple to you, it's an opportunity to see it with fresh eyes. Perhaps today, you'll uncover a new talent or hidden passion.",
                "Sometimes life tells you to take a little break. Perhaps now is the time to save your energy for a new season. Remember, every winter is followed by spring. Stay calm and wait for the blossoms ahead."
            ],
            "fa": [
                "زندگی گاهی مثل یک دریاچه آرام است. ممکن است حرکت زیادی نبینی، اما زیبایی در آرامش آن نهفته است. از این لحظات سکوت برای بازسازی خودت استفاده کن. آرامش، سکوی پرتاب تو برای لحظات هیجان‌انگیز آینده است.",
                "احساس بی‌حوصلگی می‌تواند شروعی برای کشف چیزی جدید باشد. وقتی دنیا در نظرت ساده به نظر می‌رسد، فرصتی داری تا با چشمانی تازه به آن نگاه کنی. شاید همین امروز، یک استعداد جدید یا علاقه پنهان را کشف کنی.",
                "گاهی زندگی به تو می‌گوید که کمی استراحت کنی. شاید اکنون وقت آن است که انرژی خود را برای فصل جدیدی ذخیره کنی. به یاد داشته باش که هر زمستان، بهاری در پی دارد. آرام باش و منتظر شکوفه‌های بعدی بمان."
            ]
        },
        "color": "#808080",
        "season": "winter"
    },
    "angry": {
        "music": ["angry1.mp3", "angry2.mp3", "angry3.mp3"],
        "color": "#FF0000",  # Red
        "stories": {
            "en": [
                "Anger is like fire; if you don't control it, it will burn you. But if you harness the fire, you can warm yourself and create light. Use anger as a tool to bring about positive change.",
                "When anger arises, remind yourself that silence is the strongest response. In silence lies a power that allows you to respond wisely instead of reacting impulsively. Your calmness is your victory.",
                "Every time you feel angry, it's an opportunity to know yourself better. Anger reveals what truly matters to you. Instead of pushing it away, listen to it and use it for growth and progress."
            ],
            "fa": [
                "خشم مثل آتش است؛ اگر کنترلش نکنی، تو را می‌سوزاند. اما اگر آتش را در دست بگیری، می‌توانی با آن گرم شوی و نور بیافرینی. از خشم به عنوان ابزاری برای ایجاد تغییر مثبت استفاده کن.",
                "وقتی عصبانیت سراغت می‌آید، به خود یادآوری کن که سکوت قوی‌ترین پاسخ است. در سکوت، قدرتی نهفته است که به تو اجازه می‌دهد به جای واکنش، پاسخ هوشمندانه بدهی. آرامش تو، پیروزی توست.",
                "هر بار که عصبانی می‌شوی، فرصتی داری تا خودت را بهتر بشناسی. خشم نشان‌دهنده چیزی است که برایت اهمیت دارد. به جای دور کردن آن، به آن گوش بده و از آن برای پیشرفت و رشد استفاده کن."
            ]
        },
        "color": "#FF0000",
        "season": "summer"
    }
}

def analyze_emotion(image_array):
    try:
        result = DeepFace.analyze(image_array, actions=['emotion'])
        return result[0]['dominant_emotion']
    except Exception as e:
        print(f"Error in emotion analysis: {e}")
        return None

def load_users():
    try:
        if os.path.exists(USER_FILE):
            with open(USER_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading users: {e}")
    return {}

def save_users(users):
    try:
        with open(USER_FILE, 'w') as f:
            json.dump(users, f, indent=4)
    except Exception as e:
        print(f"Error saving users: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/music/<filename>')
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    users = load_users()
    if email not in users:
        users[email] = {
            'password': password,
            'created_at': datetime.now().isoformat()
        }
        save_users(users)
    
    session['user_id'] = email
    return jsonify({'status': 'success'})

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'No image provided'})
    
    file = request.files['image']
    nparray = np.fromfile(file, np.uint8)
    img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({'status': 'error', 'message': 'Invalid image'})
    
    emotion = analyze_emotion(img)
    if not emotion:
        emotion = 'neutral'
    
    return jsonify({
        'status': 'success',
        'emotion': emotion,
        'content': content[emotion]
    })

@app.route('/rate', methods=['POST'])
def rate_content():
    data = request.get_json()
    user_id = session.get('user_id', 'anonymous')
    
    rating_history = load_rating_history()
    if user_id not in rating_history:
        rating_history[user_id] = {'stories': {}, 'music': {}}
    
    content_type = data['type']
    rating = data['rating']
    emotion = data['emotion']
    
    if content_type == 'story':
        story_index = data['storyIndex']
        rating_history[user_id]['stories'][f"{emotion}_{story_index}"] = rating
    else:
        music_index = data['musicIndex']
        rating_history[user_id]['music'][f"{emotion}_{music_index}"] = rating
    
    save_rating_history(rating_history)
    return jsonify({'status': 'success'})

@app.route('/get-history')
def get_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify([])
    
    history = load_history()
    user_history = history.get(user_id, [])
    return jsonify(user_history)

@app.route('/save-diary', methods=['POST'])
def save_diary():
    data = request.get_json()
    user_id = session.get('user_id', 'anonymous')
    
    history = load_history()
    if user_id not in history:
        history[user_id] = []
    
    history[user_id].append({
        'date': data['date'],
        'emotion': data['emotion'],
        'text': data['text'],
        'musicRating': data.get('musicRating'),
        'storyRating': data.get('storyRating')
    })
    
    save_history(history)
    return jsonify({'status': 'success'})

def load_rating_history():
    try:
        if os.path.exists(RATING_FILE):
            with open(RATING_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading rating history: {e}")
    return {}

def save_rating_history(history):
    try:
        with open(RATING_FILE, 'w') as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        print(f"Error saving rating history: {e}")

def load_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")
    return {}

def save_history(history):
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        print(f"Error saving history: {e}")

if __name__ == '__main__':
    app.run(debug=True)

