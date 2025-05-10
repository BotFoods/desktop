import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';

const Configuracoes = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const { token, user, validateSession } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    const handleInputChange = (e) => {
        setPhoneNumber(e.target.value);
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
        setStatusMessage(null); // Reset status message
        setPhoneNumber(user.contato_loja);
        try {
            const startOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: user.contato_loja }),
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
        setStatusMessage(null); // Reset status message
        setPhoneNumber(user.contato_loja);
        try {
            const stopOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: user.contato_loja }),
            };

            const stopResponse = await fetch(`${API_BASE_URL}/api/stop`, stopOptions);
            if (stopResponse.ok) {
                setQrCode(null);
                setPhoneNumber('');
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

    const handleChangeWhatsApp = async () => {
        setLoading(true);
        try {
            const changeOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: phoneNumber }),
            };

            const changeResponse = await fetch(`${API_BASE_URL}/api/change`, changeOptions);
            if (changeResponse.ok) {
                console.log('Número do WhatsApp alterado com sucesso');
            } else {
                console.error('Erro ao alterar número do WhatsApp');
            }
        } catch (error) {
            console.error('Error during WhatsApp number change:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-gray-900 text-white flex flex-col">
            <Header />
            <div className="flex-grow flex flex-col items-center">
                <div className="ml-64 pt-16 p-4 flex-grow flex">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-3xl font-bold mb-4">Configurações</h1>
                        <div className="w-full max-w-4xl bg-gray-800 p-4 rounded shadow">
                            <div className="mb-4 flex flex-col items-center">
                                <label className="block text-gray-300 mb-2">Número do WhatsApp</label>
                                <input
                                    type="text"
                                    value={user.contato_loja}
                                    onChange={handleInputChange}
                                    className="p-2 rounded bg-gray-700 text-white disabled:opacity-50"
                                    placeholder={user.contato_loja}
                                    disabled={true}
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleConnect}
                                    className={`px-3 py-1 rounded text-white ${loading
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                    disabled={loading}
                                >
                                    {loading ? 'Conectando...' : 'Conectar'}
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className={`px-3 py-1 rounded text-white ${loading
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    disabled={loading}
                                >
                                    {loading ? 'Desconectando...' : 'Desconectar'}
                                </button>
                                <button
                                    onClick={handleChangeWhatsApp}
                                    className={`px-3 py-1 rounded text-white ${loading
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                    disabled={loading}
                                >
                                    {loading ? 'Alterando...' : 'Alterar WhatsApp'}
                                </button>
                            </div>
                            {statusMessage && (
                                <div
                                    className={`mt-2 text-center ${
                                        statusMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                                    }`}
                                >
                                    {statusMessage.text}
                                </div>
                            )}
                            {loading && (
                                <div className="mt-4 text-gray-300">Carregando...</div>
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
        </div>
    );
};

export default Configuracoes;
