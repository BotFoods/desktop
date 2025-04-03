import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const CategoryMenu = ({ categories = [], onSelectCategory }) => {
  const location = useLocation();
  const isCadastrosRoute = location.pathname.startsWith('/cadastros');
  const isMovimentacoesRoute = location.pathname.startsWith('/movimentacoes');
  const isMesasRoute = location.pathname.startsWith('/mesas');
  const isPdvMesasRoute = location.pathname.startsWith('/pdv/mesa');
  const { user } = useAuth();

  // Shared category rendering logic
  const categoryButtons = categories.map((category) => (
    <li key={category}>
      <button
        onClick={() => onSelectCategory(category)}
        className="text-gray-300 hover:text-white"
      >
        {category}
      </button>
    </li>
  ));

  return (
    <aside className="fixed top-0 left-0 w-64 bg-gray-800 shadow-md z-20 h-full dark:bg-gray-800 dark:text-white">
      <nav className="px-4 py-6">
        <div className="text-2xl font-bold text-white mb-6">
          <button onClick={() => onSelectCategory('')} className="text-gray-300 hover:text-white">BotFoods</button>
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
          {isMovimentacoesRoute && (
            <>
              <li>
                <button onClick={() => onSelectCategory('Entrada')} className="text-gray-300 hover:text-white">Entrada</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Saída')} className="text-gray-300 hover:text-white">Saída</button>
              </li>
            </>
          )}
          {isMesasRoute && (
            <>
              <li>
                <button onClick={() => onSelectCategory('Nova Mesa')} className="text-gray-300 hover:text-white">Nova Mesa</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Reservas')} className="text-gray-300 hover:text-white">Reservas</button>
              </li>
            </>
          )}
          {(isPdvMesasRoute || categories.length > 0) && categoryButtons}
        </ul>
        <div className="bottom-0 flex fixed pb-4 text-gray-400">
          <p>Conectado como: {user}</p>
        </div>
      </nav>
    </aside>
  );
};

export default CategoryMenu;