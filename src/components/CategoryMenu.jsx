import React from 'react';
import { useLocation } from 'react-router-dom';

const CategoryMenu = ({ categories, onSelectCategory }) => {
  const location = useLocation();
  const isCadastrosRoute = location.pathname.startsWith('/cadastros');

  return (
    <aside className="fixed top-0 left-0 w-64 bg-gray-800 shadow-md z-20 h-full dark:bg-gray-800 dark:text-white">
      <nav className="px-4 py-6">
        <div className="text-2xl font-bold text-white mb-6">
          <button onClick={() => onSelectCategory('')} className="text-gray-300 hover:text-white">Meu Projeto</button>
        </div>
        <ul className="space-y-4">
          {isCadastrosRoute && (
            <>
              <li>
                <button onClick={() => onSelectCategory('Categorias')} className="text-gray-300 hover:text-white">Categorias</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Produtos')} className="text-gray-300 hover:text-white">Produtos</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Pessoas')} className="text-gray-300 hover:text-white">Pessoas</button>
              </li>
            </>
          )}
          {categories.map((category) => (
            <li key={category}>
              <button
                onClick={() => onSelectCategory(category)}
                className="text-gray-300 hover:text-white"
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default CategoryMenu;