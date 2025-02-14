import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loja, setLoja] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { token, setToken } = useAuth();
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
        localStorage.setItem('token', data.token); // Persist token in localStorage
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
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-1/4 text-gray-600">
        <h2 className="text-2xl mb-4 text-center">Bot Foods - Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Loja"
          value={loja}
          onChange={(e) => setLoja(e.target.value)}
          className="mb-2 p-2 border rounded w-full text-gray-600"
          autoFocus
        />
        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="mb-2 p-2 border rounded w-full text-gray-600"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mb-2 p-2 border rounded w-full text-gray-600"
        />
        <button type="submit" className="bg-sky-500 text-white px-4 py-2 w-full rounded">Login</button>
      </form>
    </div>
  );
};

export default Login;
