// frontend/src/components/PasswordField.js
import { useState, useRef, useEffect } from 'react';

function PasswordField({ name, value, onChange, placeholder, autoComplete, minLength, required, label }) {
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // Отключаем автозаполнение браузера для предотвращения перезагрузок
        if (inputRef.current) {
            inputRef.current.setAttribute('autocomplete', 'new-password');
        }
    }, []);

    const handleToggle = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-field password-field">
            <label>{label}</label>
            <div className="password-input-wrapper">
                <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete || 'new-password'}
                    minLength={minLength}
                    required={required}
                    spellCheck="false"
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={handleToggle}
                    tabIndex="-1"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                    {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94Z"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19Z"/>
                            <line x1="14.12" y1="14.12" x2="19.8" y2="19.8"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

export default PasswordField;
