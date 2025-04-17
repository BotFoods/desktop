import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const FecharCaixaButton = ({ pdv }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closementValue, setClosementValue] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleCloseCaixa = () => {
        const options = {
            method: 'PATCH',
            headers: {
                authorization: token,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ valor_final: closementValue })
        };

        fetch(`http://localhost:8080/api/caixas/fechamento/${pdv.pdv.caixa.id_caixa}`, options)
            .then(response => response.json())
            .then(response => {
                console.log(response);
                if (response.success) {
                    navigate(0); // Reload the page
                }
            })
            .catch(err => console.error(err));
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
                Fechar Caixa
            </button>
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
                    <div className="bg-black bg-opacity-50 absolute inset-0"></div>
                    <div className="bg-white p-6 rounded shadow-lg z-10">
                        <h2 className="text-xl font-bold mb-4">Fechar Caixa</h2>
                        <input
                            type="text"
                            value={closementValue}
                            onChange={(e) => setClosementValue(e.target.value)}
                            placeholder="Valor de Fechamento"
                            className="border p-2 mb-4 w-full"
                            autoFocus
                        />
                        <button
                            onClick={handleCloseCaixa}
                            className="bg-blue-500 text-white px-5 py-2 m-1 rounded"
                        >
                            Confirmar
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="bg-red-500 text-white px-5 py-2 m-1 rounded"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FecharCaixaButton;