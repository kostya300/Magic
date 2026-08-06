// frontend/src/components/CategoryDropdown.js
import { useState, useRef, useEffect } from 'react';
function CategoryDropdown({ categories, selectedCategory, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLabel = selectedCategory?.name ?? 'Везде';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSelect = (category) => {
        onSelect(category);
        setIsOpen(false);
    };

    return (
        <div className="category-dropdown" ref={dropdownRef}>
            <button
                className="category-dropdown__button"
                onClick={handleToggle}
                type="button"
                aria-label="Выбор категории"
            >
                <span className="category-dropdown__label">{currentLabel}</span>
                <svg
                    className={`category-dropdown__arrow ${isOpen ? 'active' : ''}`}
                    width="12" height="8" viewBox="0 0 12 8" fill="none"
                >
                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {isOpen && (
                <div className="category-dropdown__list">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`category-dropdown__item ${cat.id === selectedCategory?.id ? 'active' : ''}`}
                            onClick={() => handleSelect(cat)}
                            type="button"
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CategoryDropdown;
