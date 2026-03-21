import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import Cinemas from '../pages/Cinemas';
import Account from '../pages/Account';
import Users from '../pages/Users';
import Rooms from '../pages/Rooms';
import Movies from '../pages/Movies';
import Showtimes from '../pages/Showtimes';
import MovieInfo from '../pages/MovieInfo';
import ReservationStep1 from '../pages/ReservationStep1';
import ReservationStep2 from '../pages/ReservationStep2';
import ReservationStep3 from '../pages/ReservationStep3';

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
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/showtimes" element={<Showtimes />} />
            <Route path="/movie/movie-info/:movieId" element={<MovieInfo />} />
            <Route path="/reservations-step-1" element={<ReservationStep1 />} />
            <Route path="/reservations-step-2" element={<ReservationStep2 />} />
            <Route path="/reservations-step-3" element={<ReservationStep3 />} />
        </Routes>
    )
}
export default AppRoutes
