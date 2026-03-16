import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import { getMovies } from '../services/movieServices.js';
import '../pages-css/ReservationStep1.css';

function ReservationStep1() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [moviesList, setMoviesList] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [cinemasList, setCinemasList] = useState([]);
    const [cinema, setCinema] = useState('');

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage();

    const fetchMovies = async () => {
        try {
            debugger;
            const moviesData = await getMovies();
            setMoviesList(moviesData.results);
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to fetch movies!");
                setFormErrors(errorData);
            }
        }
    };


    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchMovies();
        }
    }, [user]);

    const selectMovie = (movie) => {
        setSelectedMovie(movie);
        setOpenDropdown(true);

    }

    return (
        <>
            <Header page="reservations-step-1" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{"Reservation 1st"}</h1>

                    <h2 className="step-instructions">Choose a movie</h2>

                    {moviesList.length > 0 ? (
                        <div className="carousel-container">
                            {moviesList.map(movie => (movie.is_active ? (
                                <div key={movie.id} className="carousel-item" onClick={() => selectMovie(movie)}>
                                    <div className={`home-card ${selectedMovie?.id === movie.id ? 'selected-card' : ''}`}>
                                        <div className="home-card-image">
                                            <img src={movie.poster || '/logo.svg'} alt={movie.title} />
                                        </div>
                                        <div className="home-card-info">
                                            <h2 style={{ fontSize: '1.2rem' }}>{movie.title}</h2>
                                        </div>
                                    </div>
                                </div>) : (
                                <p style={{ color: 'white' }}>No active movies found!</p>
                            )
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'white' }}>Loading movies...</p>
                    )}
                    {/* TODO: Add cinemas */}
                    {/* <div className={openDropdown ? "open-dropdown" : "close-dropdown"}>
                        <Select label="Select a Cinema" value={cinema} onChange={(e) => setCinema(e.target.value)} error={formErrors.cinema?.[0]} options={cinemaOptions} />
                    </div> */}
                </main>
            </div>
        </>
    )
}
export default ReservationStep1