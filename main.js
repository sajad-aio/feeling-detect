let currentStoryIndex = 0;
let currentMusicIndex = 0;
let currentContent = null;
let currentLanguage = 'fa';
let video = null;
let canvas = null;
let currentStoryRating = null;
let currentMusicRating = null;

function initializeCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    const startButton = document.getElementById('startCamera');
    const captureButton = document.getElementById('capture');
    const imageInput = document.getElementById('imageInput');

    startButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            startButton.classList.add('hidden');
            captureButton.classList.remove('hidden');
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    });

    captureButton.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            uploadImage(formData);
        }, 'image/jpeg');
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const formData = new FormData();
            formData.append('image', e.target.files[0]);
            uploadImage(formData);
        }
    });
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    showLoginForm();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    showLoginForm();
}

function showWelcomeMessage(username) {
    const welcomeDiv = document.getElementById('userWelcome');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const message = currentLanguage === 'fa' 
        ? `کاربر عزیز ${username} به سایت ما خوش آمدید` 
        : `Welcome dear ${username} to our website`;
    
    welcomeMessage.textContent = message;
    welcomeDiv.classList.remove('hidden');
    document.querySelector('button[onclick="showLoginModal()"]').classList.add('hidden');
}

function showForgotPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    document.getElementById('createAccountForm').classList.add('hidden');
}

function showCreateAccount() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    document.getElementById('createAccountForm').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    document.getElementById('createAccountForm').classList.add('hidden');
}

function handleLogin() {
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;

    if (!email || !password) {
        alert(currentLanguage === 'fa' ? 'لطفا تمام فیلدها را پر کنید' : 'Please fill all fields');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeLoginModal();
            showWelcomeMessage(email);
            alert(currentLanguage === 'fa' ? 'ورود با موفقیت انجام شد' : 'Login successful');
        } else {
            alert(currentLanguage === 'fa' ? 'خطا در ورود' : 'Login error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در ارتباط با سرور' : 'Server connection error');
    });
}

function handleCreateAccount() {
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    
    if (!username || !email || !password) {
        alert(currentLanguage === 'fa' ? 'لطفا تمام فیلدها را پر کنید' : 'Please fill all fields');
        return;
    }
    
    fetch('/create-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeLoginModal();
            showWelcomeMessage(username);
            document.querySelector('button[onclick="showLoginModal()"]').classList.add('hidden');
            alert(currentLanguage === 'fa' ? 'حساب کاربری با موفقیت ایجاد شد' : 'Account created successfully');
        } else {
            alert(currentLanguage === 'fa' ? 'خطا در ایجاد حساب کاربری' : 'Error creating account');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در ارتباط با سرور' : 'Server connection error');
    });
}

function handleForgotPassword() {
    const email = document.getElementById('forgotEmail').value;
    
    fetch('/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(currentLanguage === 'fa' ? 'رمز عبور جدید به آدرس ایمیل شما ارسال شد' : 'Password reset link has been sent to your email');
            showLoginForm();
        }
    })
    .catch(error => console.error('Error:', error));
}

function showHistory() {
    fetch('/get-history')
    .then(response => response.json())
    .then(data => {
        const historyContent = document.getElementById('historyContent');
        historyContent.innerHTML = formatHistoryData(data);
        document.getElementById('historyModal').style.display = 'block';
    })
    .catch(error => console.error('Error:', error));
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function formatHistoryData(data) {
    return data.map(entry => `
        <div class="border-b p-4">
            <div class="font-bold">${formatDate(entry.date)}</div>
            <div>${currentLanguage === 'fa' ? 'احساس' : 'Emotion'}: ${translateEmotion(entry.emotion)}</div>
            <div>${currentLanguage === 'fa' ? 'امتیاز موسیقی' : 'Music Rating'}: ${translateRating(entry.musicRating)}</div>
            <div>${currentLanguage === 'fa' ? 'امتیاز داستان' : 'Story Rating'}: ${translateRating(entry.storyRating)}</div>
            <div class="mt-2">${entry.text}</div>
        </div>
    `).join('');
}

function translateEmotion(emotion) {
    const translations = {
        happy: { en: 'Happy', fa: 'شاد' },
        sad: { en: 'Sad', fa: 'غمگین' },
        angry: { en: 'Angry', fa: 'عصبانی' },
        neutral: { en: 'Neutral', fa: 'خنثی' }
    };
    return translations[emotion][currentLanguage];
}

function translateRating(rating) {
    const translations = {
        low: { en: 'Low', fa: 'کم' },
        medium: { en: 'Medium', fa: 'متوسط' },
        high: { en: 'High', fa: 'زیاد' }
    };
    return rating ? translations[rating][currentLanguage] : '-';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(currentLanguage === 'fa' ? 'fa-IR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showEmotion(emotion) {
    const emotionDisplay = document.getElementById('detectedEmotion');
    const emotionText = document.getElementById('emotionText');
    const emojiDisplay = document.getElementById('emojiDisplay');
    
    const translations = {
        happy: { en: 'Happy', fa: 'شاد' },
        sad: { en: 'Sad', fa: 'غمگین' },
        angry: { en: 'Angry', fa: 'عصبانی' },
        neutral: { en: 'Neutral', fa: 'خنثی' }
    };
    
    const emojis = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        neutral: '😐'
    };
    
    emotionText.textContent = translations[emotion][currentLanguage];
    emojiDisplay.textContent = emojis[emotion];
    emotionDisplay.classList.remove('hidden');
    
    // Update seasonal image
    const seasonalImage = document.getElementById('seasonalImage');
    const seasonalImages = {
        happy: {
            spring: '/static/images/happy-spring.jpg',
            summer: '/static/images/happy-summer.jpg'
        },
        sad: {
            autumn: '/static/images/sad-autumn.jpg',
            winter: '/static/images/sad-winter.jpg'
        },
        angry: {
            summer: '/static/images/angry-summer.jpg',
            winter: '/static/images/angry-winter.jpg'
        },
        neutral: {
            spring: '/static/images/neutral-spring.jpg',
            autumn: '/static/images/neutral-autumn.jpg'
        }
    };
    
    const seasons = Object.keys(seasonalImages[emotion]);
    const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
    seasonalImage.src = seasonalImages[emotion][randomSeason];
    
    // Create seasonal animation based on emotion and season
    createSeasonalAnimation(emotion, randomSeason);
    
    updateBackgroundColor(emotion);
    showAdvisorRecommendation(emotion);
}

function showAdvisorRecommendation(emotion) {
    const advisorContent = document.getElementById('advisorContent');
    const recommendations = {
        happy: {
            en: "Channel your positive energy into creative activities. Share your joy with others!",
            fa: "انرژی مثبت خود را در فعالیت‌های خلاقانه به کار بگیرید. شادی خود را با دیگران به اشتراک بگذارید!"
        },
        sad: {
            en: "Take time to process your emotions. Remember that it's okay to feel this way, and consider talking to someone you trust.",
            fa: "برای پردازش احساسات خود زمان بگذارید. به یاد داشته باشید که این احساس طبیعی است و با فرد مورد اعتماد خود صحبت کنید."
        },
        angry: {
            en: "Take deep breaths and try to identify the source of your anger. Consider peaceful activities to calm down.",
            fa: "نفس عمیق بکشید و سعی کنید منبع عصبانیت خود را شناسایی کنید. فعالیت‌های آرامش‌بخش را امتحان کنید."
        },
        neutral: {
            en: "This is a good time for self-reflection and planning. Consider setting new goals.",
            fa: "اکنون زمان خوبی برای خودشناسی و برنامه‌ریزی است. به تعیین اهداف جدید فکر کنید."
        }
    };
    
    advisorContent.textContent = recommendations[emotion][currentLanguage];
}

function uploadImage(formData) {
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            currentContent = data.content;
            currentContent.emotion = data.emotion;
            showEmotion(data.emotion);
            document.getElementById('result').classList.remove('hidden');
            currentStoryIndex = 0;
            currentMusicIndex = 0;
            currentStoryRating = null;
            currentMusicRating = null;
            updateStory();
            updateMusic();
        }
    })
    .catch(error => console.error('Error:', error));
}

function updateStoryCounter() {
    const counter = document.getElementById('storyCounter');
    if (currentContent && currentContent.stories) {
        counter.textContent = `${currentStoryIndex + 1}/${currentContent.stories[currentLanguage].length}`;
    }
}

function updateMusicCounter() {
    const counter = document.getElementById('musicCounter');
    if (currentContent && currentContent.music) {
        counter.textContent = `${currentMusicIndex + 1}/${currentContent.music.length}`;
    }
}

function updateStory() {
    const storyContent = document.getElementById('storyContent');
    if (currentContent && currentContent.stories) {
        storyContent.textContent = currentContent.stories[currentLanguage][currentStoryIndex];
        updateStoryCounter();
    }
}

function nextStory() {
    if (currentContent && currentContent.stories[currentLanguage].length > 0) {
        currentStoryIndex = (currentStoryIndex + 1) % currentContent.stories[currentLanguage].length;
        currentStoryRating = null;
        updateStory();
    }
}

function prevStory() {
    if (currentContent && currentContent.stories[currentLanguage].length > 0) {
        currentStoryIndex = (currentStoryIndex - 1 + currentContent.stories[currentLanguage].length) % currentContent.stories[currentLanguage].length;
        currentStoryRating = null;
        updateStory();
    }
}

function updateMusic() {
    const audio = document.getElementById('seasonalAudio');
    if (currentContent && currentContent.music) {
        audio.src = `/static/music/${currentContent.music[currentMusicIndex]}`;
        audio.load();
        audio.play().catch(error => console.log('Playback failed:', error));
        updateMusicCounter();
    }
}

function nextMusic() {
    if (currentContent && currentContent.music.length > 0) {
        currentMusicIndex = (currentMusicIndex + 1) % currentContent.music.length;
        currentMusicRating = null;
        updateMusic();
    }
}

function prevMusic() {
    if (currentContent && currentContent.music.length > 0) {
        currentMusicIndex = (currentMusicIndex - 1 + currentContent.music.length) % currentContent.music.length;
        currentMusicRating = null;
        updateMusic();
    }
}

function rateStory(rating) {
    currentStoryRating = rating;
    fetch('/rate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'story',
            rating: rating,
            storyIndex: currentStoryIndex,
            emotion: currentContent.emotion
        })
    })
    .then(() => {
        alert(currentLanguage === 'fa' ? 'امتیاز شما با موفقیت ثبت شد' : 'Your rating has been saved successfully');
    });
}

function rateMusic(rating) {
    currentMusicRating = rating;
    fetch('/rate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'music',
            rating: rating,
            musicIndex: currentMusicIndex,
            emotion: currentContent.emotion
        })
    })
    .then(() => {
        alert(currentLanguage === 'fa' ? 'امتیاز شما با موفقیت ثبت شد' : 'Your rating has been saved successfully');
    });
}
function createSeasonalAnimation(emotion, season) {
    const existingContainer = document.querySelector('.animation-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    const container = document.createElement('div');
    container.className = 'animation-container';
    document.body.appendChild(container);

    const particleCount = 20;
    const particles = [];

    let particleClass = '';
    let particleContent = '';

    if (emotion === 'happy') {
        particleClass = 'happy-flower';
        particleContent = '🌸';
    } else if (season === 'autumn') {
        particleClass = 'autumn-leaf';
        particleContent = '🍁';
    } else if (season === 'winter' || emotion === 'neutral') {
        particleClass = 'winter-snow';
        particleContent = '❄️';
    } else if (season === 'summer') {
        particleClass = 'summer-spark';
        particleContent = '✨';
    }

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = `seasonal-particle ${particleClass}`;
        particle.textContent = particleContent;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(particle);
        particles.push(particle);
    }
}

function saveDiary() {
    const diaryInput = document.getElementById('diaryInput');
    const diaryText = diaryInput.value;
    
    fetch('/save-diary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: diaryText,
            emotion: currentContent.emotion,
            date: new Date().toISOString(),
            musicRating: currentMusicRating,
            storyRating: currentStoryRating
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            diaryInput.value = '';
            alert(currentLanguage === 'fa' ? 'یادداشت شما با موفقیت ذخیره شد.' : 'Your diary entry has been saved successfully.');
        }
    })
    .catch(error => console.error('Error:', error));
}

function switchLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    if (lang === 'fa') {
        document.body.style.direction = 'rtl';
    } else {
        document.body.style.direction = 'ltr';
    }
    updateUILanguage();
    if (currentContent) {
        updateStory();
        showEmotion(currentContent.emotion);
    }
}

function updateBackgroundColor(emotion) {
    const colors = {
        happy: 'linear-gradient(120deg, #FFD700 0%, #FFA500 100%)',
        sad: 'linear-gradient(120deg, #00008B 0%, #4169E1 100%)',
        neutral: 'linear-gradient(120deg, #808080 0%, #A9A9A9 100%)',
        angry: 'linear-gradient(120deg, #FF0000 0%, #FF4500 100%)'
    };
    
    document.body.style.background = colors[emotion];
}

function updateUILanguage() {
    const elements = document.querySelectorAll('[data-en][data-fa]');
    elements.forEach(element => {
        element.textContent = element.dataset[currentLanguage];
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCamera();
    switchLanguage('fa');
});
