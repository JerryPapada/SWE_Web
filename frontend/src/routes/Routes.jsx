import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
        </Routes>
    )
}
export default AppRoutes
