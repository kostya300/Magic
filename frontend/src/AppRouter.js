// frontend/src/AppRouter.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/Cart';
import ProfilePage from './pages/ProfilePage';
import CategoriesPage from './pages/CategoriesPage';
import ProductCategoriesPage from './pages/ProductCategoriesPage';
import Login from './pages/Login';
import Register from './pages/Register';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products/category/:categoryId" element={<ProductCategoriesPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;