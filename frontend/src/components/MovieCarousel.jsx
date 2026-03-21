import '../pages-css/ReservationStep.css';
function MovieCarousel({ moviesList, selectMovie, selectedMovie }) {
    return (
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
                </div>
            ) : (
                <p key={`inactive-${movie.id}`} style={{ color: 'white' }}>No active movies found!</p>
            )))}
        </div>
    );
}

export default MovieCarousel;
