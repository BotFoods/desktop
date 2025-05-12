import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const FecharCaixaButton = ({ pdv }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closementValue, setClosementValue] = useState('');
    const [observacoesInput, setObservacoesInput] = useState(''); // State for observations
    const { token, user } = useAuth(); // Destructure user to get user.id
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const handleOpenModal = () => {
        setClosementValue(''); // Reset value when opening modal
        setObservacoesInput(''); // Reset observations when opening modal
        setIsModalOpen(true);
    };

    const handleCloseCaixa = () => {
        if (!user || !user.id) {
            console.error("Usuário não autenticado para fechar o caixa.");
            // Optionally, show an error to the user
            return;
        }
        if (closementValue.trim() === '') {
            alert('O valor de fechamento é obrigatório.');
            return;
        }

        const valorFinalInformado = parseFloat(closementValue.replace(',', '.'));
        if (isNaN(valorFinalInformado)) {
            alert('Valor de fechamento inválido. Use números.');
            return;
        }

        const payload = {
            usuario_fechamento_id: user.id,
            valor_final_informado: valorFinalInformado,
            observacoes: observacoesInput,
        };

        const options = {
            method: 'PATCH',
            headers: {
                authorization: token,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        };

        fetch(`${API_BASE_URL}/api/caixas/fechamento/${pdv.pdv.caixa.id_caixa}`, options)
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
                onClick={handleOpenModal}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
                Fechar Caixa
            </button>
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
                    <div className="bg-black bg-opacity-50 absolute inset-0"></div>
                    <div className="bg-white p-6 rounded shadow-lg z-10 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Fechar Caixa</h2>
                        <label htmlFor="valor_fechamento" className="block text-sm font-medium text-gray-700 mb-1">
                            Valor de Fechamento Informado <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" // Using text to allow for comma as decimal separator, will parse to float
                            id="valor_fechamento"
                            value={closementValue}
                            onChange={(e) => setClosementValue(e.target.value)}
                            placeholder="Ex: 150,50"
                            className="border p-2 mb-4 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            id="observacoes"
                            value={observacoesInput}
                            onChange={(e) => setObservacoesInput(e.target.value)}
                            placeholder="Alguma observação sobre o fechamento?"
                            className="border p-2 mb-6 w-full rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="3"
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-md transition duration-150"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseCaixa}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-2 rounded-md transition duration-150"
                            >
                                Confirmar Fechamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

FecharCaixaButton.propTypes = {
    pdv: PropTypes.shape({
        pdv: PropTypes.shape({
            caixa: PropTypes.shape({
                id_caixa: PropTypes.number.isRequired
            }).isRequired
        }).isRequired
    }).isRequired
};

export default FecharCaixaButton;