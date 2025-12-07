import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Presentation from './pages/Presentation';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:projectId" element={<Editor />} />
          <Route path="/present/:projectId" element={<Presentation />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

