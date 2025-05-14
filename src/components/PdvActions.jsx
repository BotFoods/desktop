import PrepararButton from './PrepararButton';
import CancelarButton from './CancelarButton';
import FinalizarButton from './FinalizarButton';
import FecharCaixaButton from './FecharCaixaButton';
import PropTypes from 'prop-types';

const PdvActions = ({ pdv, setPdv, setOrders, setIsModalOpen, loja_id }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 pl-40 flex justify-evenly">
      <FinalizarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} loja_id={loja_id} />
      <CancelarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} setIsModalOpen={setIsModalOpen} />
      <PrepararButton pdv={pdv} setPdv={setPdv} />
      <FecharCaixaButton pdv={pdv} />
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