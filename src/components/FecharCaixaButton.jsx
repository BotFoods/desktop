import React, { useState } from 'react';

const FecharCaixaButton = ({ pdv }) => {
    return (
        <button
            onClick={() => {
                console.log('Fechando o caixa');
                console.log('Total de vendas:', pdv.pdv.totais.valor_total);
                console.log('Total de itens:', pdv.pdv.totais.quantidade_itens);
            }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
            Fechar Caixa
        </button>
    );
};

export default FecharCaixaButton;