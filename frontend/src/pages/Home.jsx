

import { useAuth } from '../context/Authorisation';
import Header from '../components/Header';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import MovieCardForHome from '../components/MovieCardForHome.jsx';
import { getMovies, getRatingOptions } from '../services/movieServices.js';
import { useEffect } from 'react';
import { useState } from 'react';
function Home() {

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [moviesList, setMoviesList] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [ratingOptions, setRatingOptions] = useState([]);


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
    const fetchRatingOptions = async () => {
        try {
            const ratingOptionsData = await getRatingOptions();
            setRatingOptions(ratingOptionsData.results);
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to fetch rating options!");
                setFormErrors(errorData);
            }
        }
    };


    useEffect(() => {
        fetchMovies();
        fetchRatingOptions();
    }, []);

    return (
        <>
            <Header page="home" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>Home</h1>
                    <div className="catalogue-visible">
                        {moviesList.length > 0 ? (
                            <div className="catalogue-grid">
                                {moviesList.map((movie) => (
                                    movie.is_active &&
                                    <MovieCardForHome key={movie.id} movie={movie} onSetMsg={setDisplayMsg} onRefresh={fetchMovies} ratingOptions={ratingOptions} />))}
                            </div>)
                            : (<p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>No Movies found.</p>)
                        }
                    </div>
                </main>
            </div>
        </>
    );
}
export default Home