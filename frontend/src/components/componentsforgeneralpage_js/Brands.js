// frontend/src/components/componentsforgeneralpage_js/Brands.js
import '../../styles/components/generalpagecss/Brands.css';

const brands = ['Apple', 'Samsung', 'Sony', 'ASUS', 'LG', 'Lenovo', 'Dell', 'Bose'];

function Brands() {
  return (
    <section className="general-brands">
      <p className="general-brands-label">Официальные партнёры</p>
      <div className="general-brands-list">
        {brands.map(brand => (
          <button key={brand} className="general-brands-item">{brand}</button>
        ))}
      </div>
    </section>
  );
}

export default Brands;
