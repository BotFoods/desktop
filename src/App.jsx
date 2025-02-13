import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Caixa from './pages/Caixa';
import Cadastros from './pages/Cadastros';

const App = () => {
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-900 text-white min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/cadastros" element={<Cadastros />} />
            {/* Adicione outras rotas aqui */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;