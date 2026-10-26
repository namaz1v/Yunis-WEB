let localGarage = JSON.parse(localStorage.getItem('car_garage')) || [];

document.addEventListener('DOMContentLoaded', () => {
    loadCars();
    checkProfile();
    updateGarageUI();

    // Отправка формы создания машины
    document.getElementById('carForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let inputImage = document.getElementById('image').value.trim();
        
        const newCar = {
            brand: document.getElementById('brand').value,
            model: document.getElementById('model').value,
            year: parseInt(document.getElementById('year').value),
            price: parseInt(document.getElementById('price').value),
            image: inputImage
        };

        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCar)
        });

        if (response.ok) {
            document.getElementById('carForm').reset();
            loadCars();
        }
    });

    // Форма авторизации/профиля
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('auth-username').value;
        const phone = document.getElementById('auth-phone').value;

        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone })
        });
        checkProfile();
        toggleModal('profileModal');
    });
});

// Функция подбора красивого фото по марке, если ссылка некорректная
function getCarPlaceholder(brand) {
    const cleanBrand = brand.toLowerCase().trim();
    if (cleanBrand.includes('audi')) {
        return 'https://unsplash.com'; // Строгая темная Audi
    }
    if (cleanBrand.includes('bmw')) {
        return 'https://unsplash.com'; // Премиальная BMW
    }
    if (cleanBrand.includes('mercedes') || cleanBrand.includes('бенз') || cleanBrand.includes('benz')) {
        return 'https://unsplash.com'; // Черный Mercedes
    }
    if (cleanBrand.includes('porsche') || cleanBrand.includes('порш')) {
        return 'https://unsplash.com'; // Спортивный Porsche
    }
    // Стандартный премиальный спорткар для остальных марок
    return 'https://unsplash.com'; 
}

// Загрузка машин с сервера
async function loadCars() {
    const response = await fetch('/api/cars');
    const cars = await response.json();
    const container = document.getElementById('carsContainer');
    container.innerHTML = '';

    cars.forEach(car => {
        const card = document.createElement('div');
        card.className = 'car-card';
        
        const sellerName = car.seller === "Marku Marius" ? "Марку Мариус" : "Намазов Юнис";
        const sellerPhone = car.phone || "89998265757";

        // Жесткая проверка: если ссылка пустая, ведет на главную unsplash или не является прямым файлом изображения
        let carImg = car.image;
        if (!carImg || carImg.trim() === "" || carImg.trim() === "https://unsplash.com" || (carImg.includes('unsplash.com') && !carImg.includes('photo-'))) {
            carImg = getCarPlaceholder(car.brand);
        }

        card.innerHTML = `
            <img src="${carImg}" alt="${car.brand}" onerror="this.src='https://unsplash.com'">
            <div class="car-info">
                <h3>${car.brand} ${car.model}</h3>
                <p>Год выпуска: ${car.year}</p>
                <div class="price">$${car.price.toLocaleString()}</div>
            </div>
            <div class="card-actions">
                <button class="btn-buy" onclick="openDealModal('${car.brand} ${car.model}', '${sellerName}', '${sellerPhone}')">Купить</button>
                <button class="btn-defer" onclick="addToGarage(${car.id}, '${car.brand} ${car.model}', '${carImg}')">В гараж</button>
            </div>
            <button class="btn-danger" style="margin: 0 24px 20px 24px;" onclick="deleteCar(${car.id})">Удалить объявление</button>
        `;
        container.appendChild(card);
    });
}


// Удаление машины
async function deleteCar(id) {
    if (confirm('Удалить эту машину из базы авторынка?')) {
        await fetch(`/api/cars/${id}`, { method: 'DELETE' });
        loadCars();
    }
}

// Управление модальными окнами
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    }
}

// Окно сделки
function openDealModal(carName, seller, phone) {
    document.getElementById('deal-car-name').innerText = carName;
    document.getElementById('deal-seller-name').innerText = seller;
    document.getElementById('deal-seller-phone').innerText = phone;
    document.getElementById('deal-seller-phone').href = `tel:${phone}`;
    toggleModal('dealModal');
}

// Добавление в Гараж
function addToGarage(id, name, img) {
    if(!localGarage.some(item => item.id === id)) {
        localGarage.push({id, name, img});
        localStorage.setItem('car_garage', JSON.stringify(localGarage));
        updateGarageUI();
    } else {
        alert('Этот автомобиль уже добавлен в ваш гараж.');
    }
}

function updateGarageUI() {
    const countEl = document.getElementById('garage-count');
    if (countEl) countEl.innerText = localGarage.length;
    
    const list = document.getElementById('garageItems');
    if (!list) return;
    
    if(localGarage.length === 0) {
        list.innerHTML = '<p class="empty-text">Ваш личный гараж пуст.</p>';
        return;
    }
    
    // Отрисовка авто в гараже с миниатюрами фотографий вместо скучного списка
    list.innerHTML = localGarage.map(item => `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${item.img}" style="width:70px; height:45px; object-fit:cover; border-radius:6px; background:#0f172a;">
                <span style="font-weight:600; font-size:15px; color:#fff;">${item.name}</span>
            </div>
            <button class="btn-danger" style="padding:6px 12px; font-size:14px; border-radius:6px;" onclick="removeFromGarage(${item.id})">Исключить</button>
        </div>
    `).join('');
}

function removeFromGarage(id) {
    localGarage = localGarage.filter(item => item.id !== id);
    localStorage.setItem('car_garage', JSON.stringify(localGarage));
    updateGarageUI();
}

// Проверка сессии профиля
async function checkProfile() {
    const response = await fetch('/api/profile');
    const data = await response.json();
    
    const navBtn = document.getElementById('profile-nav-btn');
    const viewAnon = document.getElementById('profile-view-anonymous');
    const viewLogged = document.getElementById('profile-view-logged');

    if (data.logged) {
        let displayName = data.username === "Guest" ? "Личный кабинет" : data.username;
        if (navBtn) navBtn.innerHTML = `<span>👤</span> ${displayName}`;
        if (viewAnon) viewAnon.style.display = 'none';
        if (viewLogged) viewLogged.style.display = 'block';
        document.getElementById('user-display-name').innerText = data.username === "Guest" ? "Пользователь" : data.username;
        document.getElementById('user-display-phone').innerText = data.phone;
    } else {
        if (navBtn) navBtn.innerHTML = '<span>👤</span> Вход / Профиль';
        if (viewAnon) viewAnon.style.display = 'block';
        if (viewLogged) viewLogged.style.display = 'none';
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    checkProfile();
    toggleModal('profileModal');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
