import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import Cinemas from '../pages/Cinemas';
import Account from '../pages/Account';
import Users from '../pages/Users';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/cinemas" element={<Cinemas />} />
            <Route path="/account" element={<Account />} />
            <Route path="/users" element={<Users />} />
        </Routes>
    )
}
export default AppRoutes
