import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Caixa from './pages/Caixa';
import Cadastros from './pages/Cadastros';
import Login from './pages/Login';
import PrivateRoute from './routes/PrivateRoute';
import MovimentacoesCaixa from './pages/MovimentacoesCaixa';
import Mesas from './pages/Mesas';
import PdvMesa from './pages/PdvMesa';
import Cardapio from './pages/Cardapio';
import Delivery from './pages/Delivery';
import Configuracoes from './pages/Configuracoes';

const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <AuthProvider navigate={navigate}>
      <div className="bg-gray-900 text-white min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/caixa" />} />
          <Route
            path="/caixa"
            element={
                <Caixa />
            }
          />
          <Route
            path="/cadastros"
            element={
                <Cadastros />
            }
          />
          <Route
            path="/movimentacoes"
            element={
                <MovimentacoesCaixa />
            }
          />
          <Route path="*" element={<Navigate to="/caixa" />} />
          <Route
            path="/mesas"
            element={
                <Mesas />
            }
          />
          <Route
            path="/pdv/mesa/:mesaId"
            element={
                <PdvMesa />
            }
          />
          <Route
            path="/cardapio/:id/:wid"
            element={
                <Cardapio />
            }
          />
          <Route
            path="/delivery"
            element={
                <Delivery />
            }
          />
          <Route
            path="/configuracoes"
            element={
                <Configuracoes />
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;