import './App.css';
import UploadFile from './Components/UploadFile';
import Navbar from './Components/Navbar';
import About from './Components/About';
import Dashboard from './Components/Dashboard/Dashboard';
import Contact from './Components/Contact';

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
        <Route path="/contact" element={<Contact />} />

      </Routes>
    </Router>
  );
}

export default App;
