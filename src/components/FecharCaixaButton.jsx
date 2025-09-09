import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import AlertModal from './AlertModal';
import ApiErrorModal from './ApiErrorModal';
import useApiError from '../hooks/useApiError';
import { apiPatch } from '../services/ApiService';
import { FaCashRegister } from 'react-icons/fa';

const FecharCaixaButton = ({ pdv, className, children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closementValue, setClosementValue] = useState('');
    const [observacoesInput, setObservacoesInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { token, user } = useAuth();
    const { errorInfo, handleApiError, closeError } = useApiError();
    const navigate = useNavigate();
    
    // Estado para o modal de alerta (mantido para outros tipos de alertas)
    const [alertInfo, setAlertInfo] = useState({
        isOpen: false,
        title: 'Atenção',
        message: '',
        type: 'error'
    });

    // Função para mostrar o alerta
    const showAlert = (message, type = 'error', title = 'Atenção') => {
        setAlertInfo({
            isOpen: true,
            title,
            message,
            type
        });
    };

    // Função para fechar o alerta
    const closeAlert = () => {
        setAlertInfo(prev => ({
            ...prev,
            isOpen: false
        }));
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setClosementValue('');
        setObservacoesInput('');
    };

    const validateClosementValue = (value) => {
        return !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) > 0;
    };    const handleCloseCaixa = async () => {
        // Validação do valor informado
        if (!validateClosementValue(closementValue)) {
            showAlert('Por favor, informe um valor válido para o fechamento.');
            return;
        }

        setIsLoading(true);

        // Prepara o valor a ser enviado
        const valorFinalInformado = parseFloat(closementValue.replace(',', '.'));

        // Prepara o payload para a API
        const payload = {
            status: 2, // Status 2 = fechado
            usuario_fechamento_id: user.id,
            valor_final_informado: valorFinalInformado,
            observacoes: observacoesInput,
        };

        try {
            const data = await apiPatch(
                `/api/caixas/fechamento/${pdv.pdv.caixa.id_caixa}?id_loja=${user.loja_id}`,
                payload,
                token
            );

            if (data.success) {
                navigate(0); // Reload the page
            } else if (data._isApiError) {
                // Usar o novo sistema de tratamento de erro para erros de API
                await handleApiError(data._response || data, 'Erro ao fechar o caixa');
            } else {
                showAlert(data.message || 'Erro ao fechar o caixa.');
            }
        } catch (error) {
            showAlert('Erro ao fechar o caixa. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className={className || "bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
            >
                {children || (
                    <>
                        <FaCashRegister className="mr-1" />
                        <span>Fechar Caixa</span>
                    </>
                )}
            </button>
            
            {/* Modal para confirmar fechamento do caixa */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 text-white">
                    <div className="bg-black bg-opacity-75 absolute inset-0" onClick={handleCloseModal}></div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Fechar Caixa</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="valor_fechamento" className="block text-sm font-medium text-gray-300 mb-1">
                                    Valor de Fechamento Informado <span className="text-red-500">*</span>
                                </label>                                <input
                                    type="text"
                                    id="valor_fechamento"
                                    value={closementValue}
                                    onChange={(e) => setClosementValue(e.target.value)}
                                    placeholder="0,00"
                                    disabled={isLoading}
                                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-300 mb-1">
                                    Observações
                                </label>                                <textarea
                                    id="observacoes"
                                    value={observacoesInput}
                                    onChange={(e) => setObservacoesInput(e.target.value)}
                                    placeholder="Observações sobre o fechamento do caixa"
                                    disabled={isLoading}
                                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-24 disabled:opacity-50 disabled:cursor-not-allowed"
                                ></textarea>
                            </div>                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={handleCloseModal}
                                    disabled={isLoading}
                                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-md transition duration-150"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCloseCaixa}
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-md transition duration-150 flex items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Fechando...
                                        </>
                                    ) : (
                                        'Confirmar Fechamento'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de alerta para erros e mensagens */}
            <AlertModal
                isOpen={alertInfo.isOpen}
                onClose={closeAlert}
                title={alertInfo.title}
                message={alertInfo.message}
                type={alertInfo.type}
            />

            {/* Modal de erro da API */}
            <ApiErrorModal
                isOpen={errorInfo.isOpen}
                onClose={closeError}
                title={errorInfo.title}
                message={errorInfo.message}
                type={errorInfo.type}
                requiredPermission={errorInfo.requiredPermission}
                isOwnerOnly={errorInfo.isOwnerOnly}
            />
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
    }).isRequired,
    className: PropTypes.string,
    children: PropTypes.node
};

export default FecharCaixaButton;