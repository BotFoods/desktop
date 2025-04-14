import React from 'react';
import { Link } from 'react-router-dom';
import CategoryMenu from './CategoryMenu';
import { useAuth } from '../services/AuthContext';

const Header = ({ categories, onSelectCategory }) => {
  const { logout } = useAuth();
  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-gray-900 shadow-md z-10 dark:bg-gray-900 dark:text-white">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            <Link to="/">BotFoods</Link>
          </div>
          <ul className="flex space-x-6">
            <li>
              <Link to="/caixa" className="text-gray-300 hover:text-white">Balcão</Link>
            </li>
            <li>
              <Link to="/mesas" className="text-gray-300 hover:text-white">Mesas</Link>
            </li>
            <li>
              <Link to="/cadastros" className="text-gray-300 hover:text-white">Cadastros</Link>
            </li>
            <li>
              <Link to="/movimentacoes" className="text-gray-300 hover:text-white">Movimentações</Link>
            </li>
            <li>
              <Link to="/delivery" className="text-gray-300 hover:text-white">Delivery</Link>
            </li>
            <li>
              <Link to="/configuracoes" className="text-gray-300 hover:text-white">Configurações</Link>
            </li>
            <li>
              <button onClick={logout} className="text-gray-300 hover:text-white">Logout</button>
            </li>
          </ul>
        </nav>
      </header>
      <CategoryMenu categories={categories} onSelectCategory={onSelectCategory} />
    </>
  );
};

export default Header;