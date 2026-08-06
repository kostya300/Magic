// frontend/src/components/componentsforprofilepage/ActivityFeed.js
import '../../styles/components/profilecss/ActivityFeed.css';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const activity = [
  {
    id: 1,
    type: 'order',
    title: 'Заказ #ORD-2847 доставлен',
    sub: 'Ноутбук Lenovo ThinkPad X1',
    time: '2 часа назад',
    status: 'success',
  },
  {
    id: 2,
    type: 'message',
    title: 'Новое сообщение от поддержки',
    sub: 'Ваш запрос #SUP-991 обработан',
    time: '5 часов назад',
    status: 'info',
  },
  {
    id: 3,
    type: 'payment',
    title: 'Платёж выполнен',
    sub: '₽ 18 500 — Заказ #ORD-2831',
    time: 'вчера, 14:32',
    status: 'success',
  },
  {
    id: 4,
    type: 'order',
    title: 'Заказ #ORD-2798 на пути',
    sub: 'Клавиатура Keychron Q1',
    time: 'вчера, 09:15',
    status: 'warning',
  },
  {
    id: 5,
    type: 'security',
    title: 'Новый вход в систему',
    sub: 'Москва, Россия — Chrome на macOS',
    time: '2 дня назад',
    status: 'info',
  },
];

const StatusIcon = ({ status }) => {
  if (status === 'success') return <CheckCircle2 size={14} className="profile-activity-icon success" />;
  if (status === 'warning') return <AlertCircle size={14} className="profile-activity-icon warning" />;
  return <Clock size={14} className="profile-activity-icon info" />;
};

function ActivityFeed() {
  return (
    <div className="profile-activity">
      <div className="profile-activity-header">
        <h2 className="profile-activity-title">Активность</h2>
        <button className="profile-activity-link">Все события</button>
      </div>
      <ul className="profile-activity-list">
        {activity.map(item => (
          <li key={item.id} className="profile-activity-item">
            <StatusIcon status={item.status} />
            <div className="profile-activity-content">
              <p className="profile-activity-title-text">{item.title}</p>
              <p className="profile-activity-sub">{item.sub}</p>
            </div>
            <span className="profile-activity-time">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ActivityFeed;
