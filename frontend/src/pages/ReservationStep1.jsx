import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import { getMovies, getMovieShowtimes } from '../services/movieServices.js';
import '../pages-css/ReservationStep1.css';
import MovieCarousel from '../components/MovieCarousel';

function ReservationStep1() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [moviesList, setMoviesList] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [cinemasList, setCinemasList] = useState([]);
    const [cinema, setCinema] = useState('');
    const [showTimes, setShowTimes] = useState([]);
    const [openCinemaList, setOpenCinemaList] = useState(false);

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
            setDisplayMsg("Failed to fetch movies!");
        }
    };

    const fetchShowTimes = async (movieId) => {
        try {
            const showTimesData = await getMovieShowtimes(movieId);
            const showTimes = Array.isArray(showTimesData) ? showTimesData : Object.values(showTimesData);
            setShowTimes(showTimes);
            const uniqueCinemas = [];
            const cinemaNames = new Set();

            showTimes.forEach(showtime => {
                if (!cinemaNames.has(showtime.cinema_name)) {
                    cinemaNames.add(showtime.cinema_name);
                    uniqueCinemas.push({ name: showtime.cinema_name });
                }
            });
            debugger;
            setCinemasList(uniqueCinemas);
            setOpenCinemaList(true);
        } catch (error) {
            setDisplayMsg("Failed to fetch show times!");
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
        fetchShowTimes(movie.id);
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
                        <MovieCarousel moviesList={moviesList} selectMovie={selectMovie} selectedMovie={selectedMovie} />
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