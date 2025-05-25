import PrepararButton from './PrepararButton';
import CancelarButton from './CancelarButton';
import FinalizarButton from './FinalizarButton';
import FecharCaixaButton from './FecharCaixaButton';
import AguardarButton from './AguardarButton';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaTimesCircle, FaClock, FaHourglassHalf, FaCashRegister } from 'react-icons/fa';

const PdvActions = ({ pdv, setPdv, setOrders, setIsModalOpen, loja_id }) => {
  // Determine if we're in a "balcao" context (not mesa or delivery)
  const isBalcao = !pdv.pdv.venda.mesa && pdv.pdv.venda.tipo !== 'delivery';
  // Check if we're in a delivery context
  const isDelivery = pdv.pdv.venda.tipo === 'delivery';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 ml-64 bg-gray-800 text-white shadow-lg py-3 border-t border-gray-700 z-30">
      <div className="flex justify-center items-center gap-4">
        <FinalizarButton 
          pdv={pdv} 
          setPdv={setPdv} 
          setOrders={setOrders} 
          loja_id={loja_id} 
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out shadow-md"
        >
          <FaCheckCircle className="mr-1" />
          <span>Finalizar</span>
        </FinalizarButton>
        
        <CancelarButton 
          pdv={pdv} 
          setPdv={setPdv} 
          setOrders={setOrders} 
          setIsModalOpen={setIsModalOpen} 
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out shadow-md"
        >
          <FaTimesCircle className="mr-1" />
          <span>Cancelar</span>
        </CancelarButton>
        
        {/* Only show Preparar button when not in delivery context */}
        {!isDelivery && (
          <PrepararButton 
            pdv={pdv} 
            setPdv={setPdv} 
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out shadow-md"
          >
            <FaClock className="mr-1" />
            <span>Preparar</span>
          </PrepararButton>
        )}
        
        {/* Only show Aguardar button in balcao context */}
        {isBalcao && (
          <AguardarButton
            pdv={pdv}
            setPdv={setPdv}
            setOrders={setOrders}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out shadow-md"
          >
            <FaHourglassHalf className="mr-1" />
            <span>Aguardar</span>
          </AguardarButton>
        )}
        
        <FecharCaixaButton 
          pdv={pdv} 
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out shadow-md"
        >
          <FaCashRegister className="mr-1" />
          <span>Fechar Caixa</span>
        </FecharCaixaButton>
      </div>
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
