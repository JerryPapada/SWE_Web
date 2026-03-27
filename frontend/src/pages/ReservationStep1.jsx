import { useAuth } from '../context/Authorisation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import { getMovies, getMovieShowtimes } from '../services/movieServices.js';
import '../pages-css/ReservationStep.css';
import MovieCarousel from '../components/MovieCarousel';
import Select from '../components/Select';
import ShowtimeCarousel from '../components/ShowtimeCarousel';
import Button from '../components/Button';


function ReservationStep1() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [moviesList, setMoviesList] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedShowTime, setSelectedShowTime] = useState(null);
    let [cinemasList, setCinemasList] = useState([]);
    const [cinema, setCinema] = useState('');
    const [showTimes, setShowTimes] = useState([]);
    const cinemaSelectRef = useRef(null);
    const datesSelectRef = useRef(null);
    const nextStepRef = useRef(null);
    let [openCinemaList, setOpenCinemaList] = useState(false);
    let [openDates, setOpenDates] = useState(false);
    let [openNextStep, setOpenNextStep] = useState(false);


    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);

    const fetchMovies = async () => {
        try {
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
                    uniqueCinemas.push({ value: showtime.cinema_name, label: showtime.cinema_name });
                }
            });
            setCinemasList(uniqueCinemas);
            setOpenCinemaList(true);
            openCinemaList = true;
        } catch (error) {
            setDisplayMsg("Failed to fetch show times!");
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    useEffect(() => {
        if (openCinemaList && cinemaSelectRef.current) {
            cinemaSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedMovie]);

    useEffect(() => {
        if (openDates && datesSelectRef.current) {
            datesSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [openDates]);

    useEffect(() => {
        if (openNextStep && nextStepRef.current) {
            nextStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [openNextStep]);

    const selectMovie = (movie) => {
        setSelectedMovie(movie);
        setCinema('');
        fetchShowTimes(movie.id);
        setOpenDates(false);
        setOpenNextStep(false);

    }
    const selectDates = () => {
        setOpenDates(true);
    }

    const selectShowTime = (showtime) => {
        setSelectedShowTime(showtime);
        setOpenNextStep(true);
    }

    const nextStep = () => {
        debugger;
        if (user?.role === undefined || user?.role === null) {
            setDisplayMsg('You must be logged in to make a reservation!');
        } else {
            navigate('/reservations-step-2', { state: { selectedShowTime, selectedMovie, cinema } });
        }
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
                    <div ref={cinemaSelectRef} className={openCinemaList ? "open-dropdown" : "hidden"}>
                        <Select label="Select a Cinema" value={cinema} onChange={(e) => { setCinema(e.target.value); selectDates(); }} error={formErrors.cinema ? formErrors.cinema[0] : undefined} options={cinemasList} />
                    </div>
                    <div ref={datesSelectRef} className={openDates ? "open-dates" : "hidden"}>
                        <h2>Choose a Date</h2>
                        <ShowtimeCarousel showTimes={showTimes} cinema={cinema} selectedMovie={selectedMovie} selectShowTime={selectShowTime} selectedShowTime={selectedShowTime} />
                    </div>
                    <div ref={nextStepRef} className={openNextStep ? "open-next-step" : "hidden"}>
                        <Button onClick={() => nextStep()} type="submit" className="save-button" text="Next Step -&gt;">   </Button>
                    </div>
                </main>
            </div>
        </>
    )
}
export default ReservationStep1