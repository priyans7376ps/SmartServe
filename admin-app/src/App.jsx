import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home.jsx';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home title="Admin Panel" />} />
    </Routes>
  </Router>
);

export default App;
