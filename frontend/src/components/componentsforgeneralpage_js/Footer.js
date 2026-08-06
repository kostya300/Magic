// frontend/src/components/componentsforgeneralpage_js/Footer.js
import '../../styles/components/generalpagecss/Footer.css';
import { Zap } from 'lucide-react';

function Footer() {
  return (
    <footer className="general-footer">
      <div className="general-footer-inner">
        <div className="general-footer-grid">
          {/* Brand column */}
          <div className="general-footer-brand">
            <div className="general-footer-logo">
              <div className="general-footer-logo-icon">
                <Zap size={14} />
              </div>
              <span className="general-footer-logo-text">TechStore</span>
            </div>
            <p className="general-footer-desc">
              Официальный магазин электроники. Более 10 000 товаров с гарантией.
            </p>
            <div className="general-footer-socials">
              {['VK', 'TG', 'YT'].map(s => (
                <button key={s} className="general-footer-social">{s}</button>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {[
            { title: 'Покупателям', links: ['Каталог', 'Акции', 'Бонусная программа', 'Рассрочка'] },
            { title: 'Помощь', links: ['Доставка', 'Возврат', 'Гарантия', 'Контакты'] },
            { title: 'Компания', links: ['О нас', 'Магазины', 'Партнёрам', 'Карьера'] },
          ].map(({ title, links }) => (
            <div key={title} className="general-footer-col">
              <p className="general-footer-col-title">{title}</p>
              <ul className="general-footer-links">
                {links.map(l => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="general-footer-bottom">
          <p className="general-footer-copyright">© 2026 TechStore. Все права защищены.</p>
          <div className="general-footer-legal">
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Оферта</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
