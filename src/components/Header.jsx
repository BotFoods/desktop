import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CategoryMenu from './CategoryMenu';

const Header = ({ categories, onSelectCategory }) => {
  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-gray-900 shadow-md z-10 dark:bg-gray-900 dark:text-white">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            <Link to="/">Meu Projeto</Link>
          </div>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
            </li>
            <li>
              <Link to="/caixa" className="text-gray-300 hover:text-white">Caixas</Link>
            </li>
            <li>
              <Link to="/cadastros" className="text-gray-300 hover:text-white">Cadastros</Link>
            </li>
          </ul>
        </nav>
      </header>

      <CategoryMenu categories={categories} onSelectCategory={onSelectCategory} />
    </>
  );
};

export default Header;