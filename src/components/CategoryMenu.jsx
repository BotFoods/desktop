import React from 'react';
import { Link } from 'react-router-dom';

const CategoryMenu = ({ categories, onSelectCategory }) => {
  return (
    <aside className="fixed top-0 left-0 w-64 bg-gray-800 shadow-md z-20 h-full dark:bg-gray-800 dark:text-white">
      <nav className="px-4 py-6">
        <div className="text-2xl font-bold text-white mb-6">
          <Link to="/">Meu Projeto</Link>
        </div>
        <ul className="space-y-4">
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