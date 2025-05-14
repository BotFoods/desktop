import PrepararButton from './PrepararButton';
import CancelarButton from './CancelarButton';
import FinalizarButton from './FinalizarButton';
import FecharCaixaButton from './FecharCaixaButton';
import PropTypes from 'prop-types';

const PdvActions = ({ pdv, setPdv, setOrders, setIsModalOpen, loja_id }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white shadow-lg py-4 pl-40 flex justify-center space-x-6 border-t border-gray-700">
      <FinalizarButton 
        pdv={pdv} 
        setPdv={setPdv} 
        setOrders={setOrders} 
        loja_id={loja_id} 
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
      />
      <CancelarButton 
        pdv={pdv} 
        setPdv={setPdv} 
        setOrders={setOrders} 
        setIsModalOpen={setIsModalOpen} 
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
      />
      <PrepararButton 
        pdv={pdv} 
        setPdv={setPdv} 
        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
      />
      <FecharCaixaButton 
        pdv={pdv} 
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md"
      />
    </div>
  );
};

PdvActions.propTypes = {
  pdv: PropTypes.object.isRequired,
  setPdv: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
  setIsModalOpen: PropTypes.func,
  loja_id: PropTypes.number.isRequired,
};

export default PdvActions;