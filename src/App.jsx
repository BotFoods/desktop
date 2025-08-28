import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import { NotificationProvider } from './services/NotificationContext';
import Header from './components/Header';
import Home from './pages/Home';
import Caixa from './pages/Caixa';
import Cadastros from './pages/Cadastros';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import ConfiguracaoPagamento from './pages/ConfiguracaoPagamento';
import PrivateRoute from './routes/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import RequireCaixa from './components/RequireCaixa';
import MovimentacoesCaixa from './pages/MovimentacoesCaixa';
import Mesas from './pages/Mesas';
import PdvMesa from './pages/PdvMesa';
import Cardapio from './pages/Cardapio';
import Delivery from './pages/Delivery';
import DeliveryOrders from './pages/DeliveryOrders';
import Configuracoes from './pages/Configuracoes';

const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <AuthProvider navigate={navigate}>
      <NotificationProvider>
        <div className="bg-gray-900 text-white min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/configuracao-pagamento" element={
              <PrivateRoute>
                <ConfiguracaoPagamento />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/caixa" />} />
            <Route
              path="/caixa"
              element={
                <PrivateRoute>
                  <Header />
                  <Caixa />
                </PrivateRoute>
              }
            />
            <Route
              path="/cadastros"
              element={
                <PrivateRoute>
                  <Header />
                  <Cadastros />
                </PrivateRoute>
              }
            />
            <Route
              path="/movimentacoes"
              element={
                <PrivateRoute>
                  <Header />
                  <MovimentacoesCaixa />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/caixa" />} />
            <Route
              path="/mesas"
              element={
                <PrivateRoute>
                  <Header />
                  <Mesas />
                </PrivateRoute>
              }
            />
            <Route
              path="/pdv/mesa/:mesaId"
              element={
                <PrivateRoute>
                  <RequireCaixa>
                    <Header />
                    <PdvMesa />
                  </RequireCaixa>
                </PrivateRoute>
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
                <PrivateRoute>
                  <RequireCaixa>
                    <Header />
                    <Delivery />
                  </RequireCaixa>
                </PrivateRoute>
              }
            />
            <Route
              path="/delivery-orders"
              element={
                <PrivateRoute>
                  <Header />
                  <DeliveryOrders />
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <PrivateRoute>
                  <Header />
                  <Configuracoes />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
};

// Detecta se está rodando no Electron verificando a presença da API exposta pelo preload
const isElectron = window && window.electronAPI !== undefined;

// Escolhe o roteador apropriado com base no ambiente
const Router = isElectron ? HashRouter : BrowserRouter;

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;