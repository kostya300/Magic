// frontend/src/components/componentsforgeneralpage_js/Newsletter.js
import '../../styles/components/generalpagecss/Newsletter.css';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { authFetch } from '../../utils/authUtils';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await authFetch('/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage('Вы успешно подписались на рассылку!');
        setEmail('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage(errorData.detail || 'Ошибка при подписке');
      }
    } catch (err) {
      setMessage('Ошибка при подписке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="general-newsletter">
      <Bell size={24} className="general-newsletter-icon" />
      <h3 className="general-newsletter-title">Подпишитесь на скидки</h3>
      <p className="general-newsletter-sub">
        Получайте первыми информацию о новинках и эксклюзивных акциях
      </p>
      {message && (
        <p className={`general-newsletter-message ${message.includes('ошибк') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <form className="general-newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="ваш@email.ru"
          className="general-newsletter-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="general-newsletter-btn" disabled={loading}>
          {loading ? 'Подписка...' : 'Подписаться'}
        </button>
      </form>
    </section>
  );
}

export default Newsletter;
