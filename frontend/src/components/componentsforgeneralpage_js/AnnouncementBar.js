import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/components/generalpagecss/AnnouncementBar.css';

const STORAGE_KEY = 'announcement_closed';

function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const isClosed = localStorage.getItem(STORAGE_KEY);
    if (isClosed) {
      setVisible(false);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="general-announcement">
      <div className="general-announcement-inner">
        <span>🚀 Бесплатная доставка при заказе от ₽ 5 000</span>
        <span className="general-announcement-sep">|</span>
        <span>Горячая линия: 8-800-123-45-67</span>
        <button className="general-announcement-close" onClick={handleClose}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default AnnouncementBar;
