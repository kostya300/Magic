// frontend/src/components/CategoriesPage/CategoryCard.js
import '../../styles/components/CategoriesPage/CategoryCard.css';
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

function CategoryCard({ category }) {
  const navigate = useNavigate();

  return (
    <div
      className="category-card"
      onClick={() => navigate(`/products/category/${category.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="category-card-icon">{getIcon(category.name)}</div>
      <h3 className="category-card-name">{category.name}</h3>
      {/*<span className="category-card-count">{category.product_count || 0} товаров</span>*/}
    </div>
  );
}

export default CategoryCard;
