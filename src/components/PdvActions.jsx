import React from 'react';
import PrepararButton from './PrepararButton';
import CancelarButton from './CancelarButton';
import FinalizarButton from './FinalizarButton';

const PdvActions = ({ pdv, setPdv, setOrders, setIsModalOpen, setManagerPassword, setErrorMessage }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 pl-40 flex justify-around z-20">
      <FinalizarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} />
      <CancelarButton pdv={pdv} setPdv={setPdv} setOrders={setOrders} setIsModalOpen={setIsModalOpen} />
      <PrepararButton pdv={pdv} setPdv={setPdv} />
    </div>
  );
};

export default PdvActions;