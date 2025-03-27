import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loja, setLoja] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { token, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/caixa');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ loja, usuario, senha })
    };

    try {
      const response = await fetch('http://localhost:8080/api/login', options);
      const data = await response.json();
      if (data.auth) {
        setToken(data.token);
        setUser(usuario);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user_data));
        navigate('/caixa');
      } else {
        setError('Login falhou. Por favor, verifique suas credenciais.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
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
