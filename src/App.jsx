import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Caixa from './pages/Caixa';
import Cadastros from './pages/Cadastros';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-900 text-white min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/caixa" />} />
            <Route path="/caixa" element={<ProtectedRoute element={<Caixa />} />} />
            <Route path="/cadastros" element={<ProtectedRoute element={<Cadastros />} />} />
            <Route path="*" element={<Navigate to="/caixa" />} />
            {/* Adicione outras rotas aqui */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;