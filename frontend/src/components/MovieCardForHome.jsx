import { useNavigate } from 'react-router-dom';
import Button from './Button';

function MovieCardForHome({ movie, onRefresh, onSetMsg, ratingOptions }) {

    const navigate = useNavigate();
    const openMovieInfo = (movieId) => {
        navigate(`/movie/movie-info/${movieId}`);
    };

    return (

        <div className="home-card" onClick={() => openMovieInfo(movie.id)}>
            <div className="home-card-image">
                <img src={movie.poster || '/logo.svg'} alt={movie.title} />
            </div>
            <div className="home-card-info">
                <h2>{movie.title}</h2>
            </div>
        </div>

    );
}

export default MovieCardForHome;
