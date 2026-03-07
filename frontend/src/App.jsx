import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './Routes/Routes.jsx'
import './App.css'

function App() {

  return (
    <Router>
      <div className="app-container">
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
