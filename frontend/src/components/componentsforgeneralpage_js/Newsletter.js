// frontend/src/components/componentsforgeneralpage_js/Newsletter.js
import '../../styles/components/generalpagecss/Newsletter.css';
import { Bell } from 'lucide-react';
import { useState } from 'react';

function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Спасибо за подписку!');
    setEmail('');
  };

  return (
    <section className="general-newsletter">
      <Bell size={24} className="general-newsletter-icon" />
      <h3 className="general-newsletter-title">Подпишитесь на скидки</h3>
      <p className="general-newsletter-sub">
        Получайте первыми информацию о новинках и эксклюзивных акциях
      </p>
      <form className="general-newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="ваш@email.ru"
          className="general-newsletter-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="general-newsletter-btn">
          Подписаться
        </button>
      </form>
    </section>
  );
}

export default Newsletter;
