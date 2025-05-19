import PropTypes from 'prop-types';
import { FaHome, FaWineGlassAlt, FaUtensils, FaPizzaSlice, FaHamburger, FaIceCream, FaCoffee } from 'react-icons/fa';

const CategoryMenu = ({ categories, onSelectCategory }) => {
  const currentYear = new Date().getFullYear();
  
  // Mapeamento de categorias para ícones
  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('bebida')) return <FaWineGlassAlt />;
    if (categoryLower.includes('pizza')) return <FaPizzaSlice />;
    if (categoryLower.includes('burger') || categoryLower.includes('hamburguer') || categoryLower.includes('lanche')) return <FaHamburger />;
    if (categoryLower.includes('sobremesa') || categoryLower.includes('doce')) return <FaIceCream />;
    if (categoryLower.includes('café') || categoryLower.includes('cafe')) return <FaCoffee />;
    return <FaUtensils />;
  };

  return (
    <div className="fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-gray-300 overflow-y-auto">
      <nav className="p-4">
        <button 
          className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
          onClick={() => onSelectCategory && onSelectCategory('')} // Passando string vazia para limpar a seleção de categoria
        >
          <FaHome className="text-xl" />
          <span>Home</span>
        </button>

        {categories && categories.length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Categorias
            </h3>
            <div className="mt-3 space-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                  onClick={() => onSelectCategory && onSelectCategory(category)}
                >
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* Informações de Suporte no Rodapé */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-800 border-t border-gray-700">
        <div className="space-y-2 text-xs text-gray-400">
          <p className="flex justify-between">
            <span>Suporte:</span>
            <a href="mailto:suporte@botfood.com" className="text-blue-400 hover:text-blue-300">
              suporte@botfood.com.br
            </a>
          </p>
          <p className="flex justify-between">
            <span>Contato:</span>
            <span>(11) 98635-2205</span>
          </p>
          <p className="text-center mt-3 text-gray-500">
            &copy; {currentYear} BotFood - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

CategoryMenu.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string),
  onSelectCategory: PropTypes.func,
};

export default CategoryMenu;