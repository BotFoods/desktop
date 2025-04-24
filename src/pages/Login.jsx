import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loja, setLoja] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loja, usuario, senha }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('token', data.token); // Armazena o token no sessionStorage
        setUser(data.user_data); // Atualiza os dados do usuário no contexto
        setToken(data.token); // Atualiza o token no contexto
        navigate('/caixa');
      } else {
        setError('Login falhou. Por favor, verifique suas credenciais.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro. Tente novamente.');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl mb-4 text-center text-white">Bot Foods - Login</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <input
            type="text"
            placeholder="Loja"
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
            autoFocus
          />
          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <button type="submit" className="w-full p-2 rounded bg-blue-600 text-white font-bold">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
