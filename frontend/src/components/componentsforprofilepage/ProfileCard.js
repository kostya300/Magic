// frontend/src/components/componentsforprofilepage/ProfileCard.js
import '../../styles/components/profilecss/ProfileCard.css';

function ProfileCard() {
  const info = [
    { label: 'Имя', value: 'Алексей Морозов' },
    { label: 'Email', value: 'a.morozov@mail.ru' },
    { label: 'Телефон', value: '+7 (916) 543-21-00' },
    { label: 'Город', value: 'Москва, Россия' },
    { label: 'Дата регистрации', value: '14 марта 2023' },
    { label: 'Уровень', value: 'Платиновый' },
  ];

  return (
    <div className="profile-card-section">
      <h2 className="profile-card-section-title">Профиль</h2>
      <div className="profile-card-body">
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
          alt="Фото профиля"
          className="profile-card-avatar"
        />
        <div className="profile-card-info">
          {info.map(({ label, value }) => (
            <div key={label} className="profile-info-item">
              <p className="profile-info-label">{label}</p>
              <p className="profile-info-value">{value}</p>
            </div>
          ))}
        </div>
        <button className="profile-edit-btn">Редактировать</button>
      </div>
    </div>
  );
}

export default ProfileCard;
