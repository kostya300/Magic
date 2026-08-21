// frontend/src/components/componentsforgeneralpage_js/Categories.js
import '../../styles/components/generalpagecss/Categories.css';
import { useNavigate } from 'react-router-dom';

const categoryIcons = {
  'Ноутбуки': '💻',
  'Смартфоны': '📱',
  'Наушники': '🎧',
  'Умные часы': '⌚',
  'Планшеты': '📲',
  'Мониторы': '🖥️',
  'Клавиатуры': '⌨️',
  'Камеры': '📷',
  'Аксессуары': '🔌',
  'Игровые': '🎮',
};

function getIcon(name) {
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '📦';
}

function Categories({ categories, activeId, onSelect }) {
  const navigate = useNavigate();

  const handleClick = (category) => {
    onSelect(activeId === category.id ? null : category.id);
    navigate(`/products/category/${category.id}`);
  };

  return (
    <section>
      <div className="general-section-header">
        <h2 className="general-section-title">Категории</h2>
        <button className="general-section-link" onClick={() => navigate('/categories')}>
          Все категории <span>→</span>
        </button>
      </div>
      <div className="general-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`general-cat-btn${activeId === cat.id ? ' active' : ''}`}
            onClick={() => handleClick(cat)}
          >
            <span className="general-cat-icon">{getIcon(cat.name)}</span>
            <span className="general-cat-name">{cat.name}</span>
          </button>
            
        ))}
      </div>
    </section>
  );
}

export default Categories;
