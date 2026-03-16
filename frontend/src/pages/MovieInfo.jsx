import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMovie } from '../services/movieServices';
import { useAuth } from '../context/Authorisation';
import { useTimedMessage } from '../hooks/HeaderMessage.js';
import Button from '../components/Button';
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import '../pages-css/MovieInfo.css';

function MovieInfo() {

    const { movieId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [movie, setMovie] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);

    const fetchMovie = async () => {
        try {
            debugger;
            const movieData = await getMovie(movieId);
            debugger;
            setMovie(movieData);
        } catch (error) {
            setDisplayMsg("Failed to fetch movie!");
            const errorData = error.response?.data || {};
            setFormErrors(errorData);
        }
    };

    const handleBackToHome = () => {
        navigate('/home');
    };

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchMovie();
        }
    }, [movieId, user]);

    return (
        <>
            <Header page="movie-info" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{"Movie Information"}</h1>
                    <Button text="Back" onClick={handleBackToHome} type="button" className="back-button" />
                    {movie ? (
                        <div className="movie-details">
                            <img src={movie.poster || '/logo.svg'} alt={movie.title} className="movie-poster" />
                            <div className="movie-info">
                                <h2>{movie.title}</h2>
                                {movie.original_title && <h3>{movie.original_title}</h3>}
                                <div className="movie-stats">
                                    <span className="movie-stat-badge">{movie.rating}</span>
                                    <span className="movie-stat-badge">{movie.duration_minutes} min</span>
                                    <span className="movie-stat-badge">{movie.genre}</span>
                                    {movie.release_date && <span className="movie-stat-badge">{movie.release_date}</span>}
                                </div>
                                <p className="movie-description">{movie.description} </p>
                                <div className="movie-cast-director">
                                    {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
                                    {movie.cast && <p><strong>Cast:</strong> {movie.cast}</p>}
                                </div>
                                {movie.trailer_url && (<a href={movie.trailer_url} target="_blank" rel="noopener noreferrer" className="trailer-button">Watch Trailer</a>)}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'white', marginTop: '2rem' }}>Loading movie details...</p>
                    )}

                </main>
            </div>
        </>
    );
}

export default MovieInfo;