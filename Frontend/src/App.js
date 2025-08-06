import './App.css';
import UploadFile from './Components/UploadFile';
import Navbar from './Components/Navbar';
import About from './Components/About';

import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

function App() {
  return (
    <Router>
      <Navbar title="FINANCIAL DATA EXTRACTION..." />
      <Routes>
        <Route path="/" element={<UploadFile />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
