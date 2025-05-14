import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';

const Configuracoes = () => {
    const [editablePhoneNumber, setEditablePhoneNumber] = useState('');
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const { token, user, validateSession } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, []);
    
    useEffect(() => {
        if (user && user.contato_loja) {
            setEditablePhoneNumber(user.contato_loja);
        }
    }, [user]);

    if (!user) {
        return <div>Loading...</div>;
    }

    const formatPhoneNumber = (numberStr) => {
        if (!numberStr) return '';
        // Remove all non-digit characters
        const digitsOnly = String(numberStr).replace(/\D/g, '');

        if (digitsOnly === '') return '';

        // If it already starts with 55, assume it's correctly prefixed.
        if (digitsOnly.startsWith('55')) {
            return digitsOnly;
        }
        // Otherwise, prepend 55.
        return `55${digitsOnly}`;
    };

    const fetchQrCode = async (qrCodeId) => {
        const qrCodeOptions = {
            method: 'GET',
            headers: {
                authorization: token,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        };

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const qrCodeResponse = await fetch(
                    `${API_BASE_URL}/api/get-qrcode/${qrCodeId}`,
                    qrCodeOptions
                );
                const qrCodeData = await qrCodeResponse.json();

                if (qrCodeData.qrCode) {
                    setQrCode(qrCodeData.qrCode);
                    return;
                } else {
                    console.warn('QR code not found, retrying...');
                }
            } catch (error) {
                console.error('Error fetching QR code:', error);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }
        console.error('Failed to fetch QR code after multiple attempts');
    };

    const handleConnect = async () => {
        setLoading(true);
        setStatusMessage(null); 
        const formattedPhoneNumber = formatPhoneNumber(user.contato_loja);
        try {
            const startOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: formattedPhoneNumber }),
            };

            const startResponse = await fetch(`${API_BASE_URL}/api/start`, startOptions);
            const startData = await startResponse.json();

            if (startData.qrCodeId) {
                await fetchQrCode(startData.qrCodeId);
            } else if (startData.status === 'already_started') {
                console.log('Já conectado');
                setQrCode(null);
                setStatusMessage({ type: 'success', text: 'Você já está conectado.' });
            } else {
                console.error('QR code ID not found in response');
                setStatusMessage({ type: 'error', text: 'Erro ao capturar QRCode.' });
            }
        } catch (error) {
            console.error('Error during connection:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao capturar QRCode.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        setStatusMessage(null); 
        const formattedPhoneNumber = formatPhoneNumber(user.contato_loja);
        try {
            const stopOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: formattedPhoneNumber }),
            };

            const stopResponse = await fetch(`${API_BASE_URL}/api/stop`, stopOptions);
            if (stopResponse.ok) {
                setQrCode(null);
                setStatusMessage({ type: 'success', text: 'Desconectado com sucesso.' });
            } else {
                console.error('Erro ao desconectar');
                setStatusMessage({ type: 'error', text: 'Você já foi desconectado.' });
            }
        } catch (error) {
            console.error('Error during disconnection:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao desconectar.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeWhatsApp = async (newNumber) => {
        setLoading(true);
        setStatusMessage(null);
        const formattedPhoneNumber = formatPhoneNumber(newNumber);
        try {
            const changeOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: formattedPhoneNumber }),
            };

            const changeResponse = await fetch(`${API_BASE_URL}/api/change`, changeOptions);
            if (changeResponse.ok) {
                setStatusMessage({ type: 'success', text: 'Número do WhatsApp alterado com sucesso. Atualize os dados do usuário para ver a mudança refletida permanentemente.' });
                setIsEditingPhoneNumber(false);
            } else {
                const errorData = await changeResponse.json().catch(() => ({}));
                console.error('Erro ao alterar número do WhatsApp:', errorData);
                setStatusMessage({ type: 'error', text: `Erro ao alterar número do WhatsApp: ${errorData.message || 'Tente novamente.'}` });
            }
        } catch (error) {
            console.error('Error during WhatsApp number change:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao alterar número do WhatsApp.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditPhoneNumber = () => {
        setEditablePhoneNumber(user.contato_loja || ''); // Reset to current official number
        setIsEditingPhoneNumber(true);
        setStatusMessage(null);
    };

    const handleSavePhoneNumber = () => {
        handleChangeWhatsApp(editablePhoneNumber);
    };

    const handleCancelEditPhoneNumber = () => {
        setIsEditingPhoneNumber(false);
        setEditablePhoneNumber(user.contato_loja || ''); // Revert to original
        setStatusMessage(null);
    };

    return (
        <div className="bg-gray-900 text-white flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex">
                <div className="ml-64 pt-16 p-4 flex-grow flex items-start justify-center mt-5"> {/* Changed items-center to items-start */}
                    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h1 className="text-3xl font-bold mb-2 text-center text-white">Atendimento no Whatsapp</h1>
                        
                        <div className="mb-6">
                            <p className="text-gray-400 text-center mb-3">
                                Este é o número de WhatsApp associado à sua loja para a integração com o sistema de mensagens.
                            </p>
                            <input
                                type="text"
                                value={editablePhoneNumber}
                                onChange={(e) => setEditablePhoneNumber(e.target.value)}
                                className={`p-3 rounded bg-gray-700 text-white mb-4 w-full focus:ring-2 focus:ring-blue-500 outline-none ${!isEditingPhoneNumber ? 'disabled:opacity-70' : ''}`}
                                placeholder="Número do WhatsApp"
                                disabled={!isEditingPhoneNumber || loading}
                            />
                            
                            {!isEditingPhoneNumber ? (
                                <button
                                    onClick={handleEditPhoneNumber}
                                    className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out mb-6 ${loading || isEditingPhoneNumber
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    disabled={loading || isEditingPhoneNumber}
                                >
                                    Alterar Número
                                </button>
                            ) : (
                                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center mb-6">
                                    <button
                                        onClick={handleSavePhoneNumber}
                                        className={`text-white font-bold py-3 px-6 rounded w-full sm:w-auto transition duration-150 ease-in-out ${loading
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        disabled={loading}
                                    >
                                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                    <button
                                        onClick={handleCancelEditPhoneNumber}
                                        className={`text-gray-300 font-bold py-3 px-6 rounded w-full sm:w-auto transition duration-150 ease-in-out bg-gray-600 hover:bg-gray-700`}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col space-y-4 mb-6">
                            <button
                                onClick={handleConnect}
                                className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out ${loading || isEditingPhoneNumber
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={loading || isEditingPhoneNumber}
                            >
                                {loading && qrCode === null && !statusMessage && !isEditingPhoneNumber ? 'Conectando...' : 'Conectar'}
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out ${loading || isEditingPhoneNumber
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                disabled={loading || isEditingPhoneNumber}
                            >
                                {loading && statusMessage?.text.includes('Desconectado') && !isEditingPhoneNumber ? 'Desconectando...' : 'Desconectar'}
                            </button>
                        </div>

                        {statusMessage && (
                            <div
                                className={`mt-4 mb-4 text-center ${
                                    statusMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                                }`}
                            >
                                {statusMessage.text}
                            </div>
                        )}

                        {loading && !qrCode && !statusMessage && (
                            <div className="mt-4 text-gray-300 text-center">Carregando...</div>
                        )}

                        {qrCode && !loading && (
                            <div className="mt-6 flex flex-col items-center">
                                <h2 className="text-xl font-bold mb-2">QR Code</h2>
                                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
