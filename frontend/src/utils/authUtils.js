// Сохраняет токен в localStorage
export const setAuthTokens = (access_token, refresh_token) => {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
};

// Очищает все токены
export const clearAuthTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Проверяет авторизацию
export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
};

// Функция для обновления access-токена
export const refreshAccessToken = async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) return false;

    try {
        const response = await fetch('/users/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refresh_token })
        });

        if (!response.ok) {
            clearAuthTokens();
            return false;
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
    } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthTokens();
        return false;
    }
};

// Обёртка над fetch с автоматическим рефрешем токена
export const authFetch = async (url, options = {}) => {
    // Добавляем заголовок авторизации, если есть токен
    const token = localStorage.getItem('access_token');
    if (token && !options.headers?.Authorization) {
        options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`
        };
    }

    let response = await fetch(url, options);

    // Если 401 — пробуем обновить токен
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Повторяем запрос с новым токеном
            const newToken = localStorage.getItem('access_token');
            options.headers = {
                ...options.headers,
                Authorization: `Bearer ${newToken}`
            };
            response = await fetch(url, options);
        }
    }

    return response;
};
