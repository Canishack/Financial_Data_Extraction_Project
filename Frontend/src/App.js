import './App.css';
import UploadFile from './Components/UploadFile';
import Navbar from './Components/Navbar';
import About from './Components/About';
import Dashboard from './Components/Dashboard/Dashboard';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

function App() {
  const [extractedData, setExtractedData] = useState(null);

  return (
    <Router>
      <Navbar title="FINANCIAL DATA INTELLIGENCE SYSTEM" />

      <Routes>
        <Route
          path="/"
          element={<UploadFile setExtractedData={setExtractedData} />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard extracted={extractedData} />}
        />

        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
