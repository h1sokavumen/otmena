document.addEventListener('DOMContentLoaded', () => {
    
    const body = document.body;
    // Кнопка переключения темы: обязательно должна иметь id="theme-toggle" в HTML!
    const themeToggle = document.getElementById('theme-toggle'); 
    
    // ===================================
    // 1. ЛОГИКА ТЕМНОЙ/СВЕТЛОЙ ТЕМЫ
    // ===================================
    
    /**
     * Устанавливает класс темы, сохраняет его и обновляет текст кнопки.
     * @param {string} theme - 'dark' или 'light'
     */
    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            if (themeToggle) {
                // Если сейчас темная тема, предлагаем переключиться на светлую
                themeToggle.textContent = 'Светлая Тема'; 
            }
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            if (themeToggle) {
                // Если сейчас светлая тема, предлагаем переключиться на темную
                themeToggle.textContent = 'Темная Тема'; 
            }
        }
    }
    
    // 1.1. Инициализация: Проверка сохраненной темы или системных предпочтений
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    
    // 1.2. Обработчик клика по кнопке темы
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault(); 
            const currentTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            setTheme(currentTheme); 
        });
    }

    // ---
    
    // ===================================
    // 2. ЛОГИКА ПЛЕЕРА
    // ===================================
    
    const playButtons = document.querySelectorAll('.play-btn');
    let currentPlaying = null; // Трек, который играет в данный момент

    playButtons.forEach(button => {
        const trackId = button.getAttribute('data-track');
        const audio = document.getElementById(`audio-${trackId}`); 
        const icon = button.querySelector('i');

        if (!audio) {
            console.error(`Аудио-элемент с ID audio-${trackId} не найден.`);
            button.disabled = true;
            return;
        }
        
        button.addEventListener('click', () => {
            if (audio.paused) {
                // Останавливаем другой трек, если он играет
                if (currentPlaying && currentPlaying !== audio) {
                    currentPlaying.pause();
                    const currentPlayingButton = document.querySelector(`.play-btn[data-track="${currentPlaying.id.split('-')[1]}"]`);
                    if (currentPlayingButton) {
                         currentPlayingButton.querySelector('i').textContent = 'play_arrow';
                    }
                }

                // Запускаем текущий трек
                audio.play();
                icon.textContent = 'pause';
                currentPlaying = audio;
            } else {
                // Ставим на паузу
                audio.pause();
                icon.textContent = 'play_arrow';
                currentPlaying = null;
            }
        });

        // Обработчик окончания трека
        audio.addEventListener('ended', () => {
            icon.textContent = 'play_arrow';
            currentPlaying = null;
        });

        // Обработчик ошибки (если файл не найден)
        audio.addEventListener('error', () => {
            console.error(`Ошибка загрузки аудио для трека ${trackId}. Проверьте путь.`);
            button.disabled = true;
        });
    });
    
    // ---
    
    // ===================================
    // 3. ЛОГИКА ЗАГРУЗКИ МУЗЫКИ
    // ===================================

    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) { // Этот блок работает только если мы на странице 'about.html' (Настройки)
        const musicFile = document.getElementById('musicFile');
        const uploadMessage = document.getElementById('uploadMessage');
        const MAX_SIZE_MB = 50;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; 

        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            uploadMessage.textContent = ''; 
            uploadMessage.style.color = 'red';

            const file = musicFile.files[0];
            
            if (!file) {
                uploadMessage.textContent = 'Пожалуйста, выберите файл для загрузки.';
                return;
            }

            // 1. Проверка размера на стороне клиента
            if (file.size > MAX_SIZE_BYTES) {
                uploadMessage.textContent = `Ошибка: Файл слишком большой. Максимальный размер: ${MAX_SIZE_MB} МБ.`;
                return;
            }
            
            // 2. Отправка на сервер
            uploadMessage.textContent = 'Загрузка... Подождите.';
            uploadMessage.style.color = 'orange';
            
            const formData = new FormData();
            formData.append('music', file); // Имя поля, которое принимает сервер

            fetch('/api/upload-music', { // <-- URL вашего серверного скрипта!
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Ошибка на сервере.');
                    });
                }
                return response.json();
            })
            .then(data => {
                uploadMessage.textContent = `Успешно загружено! Файл: ${data.fileName || 'Без имени'}`;
                uploadMessage.style.color = 'green';
                uploadForm.reset(); 
            })
            .catch(error => {
                uploadMessage.textContent = `Ошибка загрузки: ${error.message}`;
                uploadMessage.style.color = 'red';
            });
        });
    }
});