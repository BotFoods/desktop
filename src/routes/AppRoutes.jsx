import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Mesas from '../pages/Mesas';
import PdvMesa from '../pages/PdvMesa';
// ...existing imports...

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* ...existing routes... */}
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/pdv/mesa/:mesaId" element={<PdvMesa />} />
        {/* ...existing routes... */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
