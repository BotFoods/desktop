import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';

const Configuracoes = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token, user, validateSession } = useAuth();

    useEffect(() => {
        validateSession();
    }, []);

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
                    `http://localhost:8080/api/get-qrcode/${qrCodeId}`,
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
        try {
            const startOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: phoneNumber }),
            };

            const startResponse = await fetch('http://localhost:8080/api/start', startOptions);
            const startData = await startResponse.json();

            if (startData.qrCodeId) {
                await fetchQrCode(startData.qrCodeId);
            } else {
                console.error('QR code ID not found in response');
            }
        } catch (error) {
            console.error('Error during connection:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            const stopOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: phoneNumber }),
            };

            const stopResponse = await fetch('http://localhost:8080/api/stop', stopOptions);
            if (stopResponse.ok) {
                setQrCode(null);
                setPhoneNumber('');
                console.log('Desconectado com sucesso');
            } else {
                console.error('Erro ao desconectar');
            }
        } catch (error) {
            console.error('Error during disconnection:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 text-white flex flex-col">
            <Header />
            <div className="flex-grow flex">
                <div className="ml-64 pt-16 p-4 flex-grow flex">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-3xl font-bold mb-4">Configurações</h1>
                        <div className="w-full max-w-4xl bg-gray-800 p-4 rounded shadow">
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Número do WhatsApp</label>
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={handleInputChange}
                                    className="p-2 rounded bg-gray-700 text-white"
                                    placeholder="somente números"
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleConnect}
                                    className={`px-4 py-2 rounded text-white ${
                                        loading
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                    disabled={loading}
                                >
                                    {loading ? 'Conectando...' : 'Conectar'}
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className={`px-4 py-2 rounded text-white ${
                                        loading
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                    disabled={loading}
                                >
                                    {loading ? 'Desconectando...' : 'Desconectar'}
                                </button>
                            </div>
                            {loading && (
                                <div className="mt-4 text-gray-300">Carregando...</div>
                            )}
                            {qrCode && !loading && (
                                <div className="mt-6">
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
