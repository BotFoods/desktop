import React from 'react';
import PrepararButton from './PrepararButton';
import CancelarButton from './CancelarButton';
import FinalizarButton from './FinalizarButton';
import FecharCaixaButton from './FecharCaixaButton';

const PdvActions = ({ pdv, setPdv, setOrders, setIsModalOpen }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 pl-40 flex justify-evenly">
      <FinalizarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} />
      <CancelarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} setIsModalOpen={setIsModalOpen} />
      <PrepararButton pdv={pdv} setPdv={setPdv} />
      <FecharCaixaButton pdv={pdv} />
    </div>
  );
};

export default PdvActions;