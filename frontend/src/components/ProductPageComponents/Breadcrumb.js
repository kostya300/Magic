import { Home } from "lucide-react";
import "../../styles/components/productPage/Breadcrumb.css";

export default function Breadcrumb({ product, onHomeClick }) {
  return (
    <nav className="product-breadcrumb">
      <button onClick={onHomeClick} className="breadcrumb-home" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'inherit' }}>
        <Home size={13} />
        Главная
      </button>
      <span className="sep">›</span>
      <span>{product?.category || "Категория"}</span>
      <span className="sep">›</span>
      <span className="current">{product?.name || "Товар"}</span>
    </nav>
  );
}
