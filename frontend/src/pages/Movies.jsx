import Header from '../components/Header';
import NavBar from '../components/NavBar';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input.jsx';
import Textarea from '../components/Textarea.jsx';
import Select from '../components/Select.jsx';
import { useAuth } from '../context/Authorisation';
import { getMovies, addMovieForm, getRatingOptions } from '../services/movieServices.js';
import MovieCard from '../components/MovieCard.jsx';
import { useNavigate } from 'react-router-dom';

function Movies() {
    const { user } = useAuth();
    const rolePermission = user?.role === 'ADMIN';
    const [movieForm, setMovieForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isActive, setIsActive] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [genre, setGenre] = useState('');
    const [rating, setRating] = useState('');
    const [director, setDirector] = useState('');
    const [poster, setPoster] = useState('');
    const [trailer, setTrailer] = useState('');
    const [moviesList, setMoviesList] = useState([]);
    const [ratingOptions, setRatingOptions] = useState([]);
    const navigate = useNavigate();

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage();



    const handleMovieForm = () => {
        setMovieForm(!movieForm);
    }

    const handleAddMovie = async (e) => {
        debugger;
        e.preventDefault();
        setFormErrors({});
        try {
            debugger;
            await addMovieForm(title, description, duration, genre, rating, director, poster, isActive, trailer);
            setMovieForm(false);
            setDisplayMsg('Success! A movie has been added!');
            setTitle('');
            setDescription('');
            setDuration('');
            setGenre('');
            setRating('');
            setDirector('');
            setPoster('');
            setTrailer('');
            setIsActive(false);
            fetchMovies();
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to add movie!");
                setFormErrors(errorData);
            }
        }
    };
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
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchMovies();
            fetchRatingOptions();
        }
    }, [user, navigate]);

    return (
        <>
            <Header page="movies" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{movieForm ? "Movie Addition" : "Movies"}</h1>
                    <Button text="Back" onClick={handleMovieForm} type="button" className={movieForm ? "back-button" : "hidden"} />
                    <Button text="Add Movie" onClick={handleMovieForm} disabled={false} type="button" className={!rolePermission || movieForm ? "hidden" : "add-button"} />
                    <form className={movieForm ? "open-add-form" : "close-add-form"}>
                        <Input label="Title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" error={formErrors.title?.[0]} />
                        <Textarea label="Description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" error={formErrors.description?.[0]} />
                        <Input label="Duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration" error={formErrors.duration_minutes?.[0]} />
                        <Input label="Genre" type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" error={formErrors.genre?.[0]} />
                        <Select label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} error={formErrors.rating?.[0]} options={ratingOptions} />
                        <Input label="Director" type="text" value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Director" error={formErrors.director?.[0]} />
                        <Input key={movieForm} label="Poster" type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setPoster(e.target.files[0])} placeholder="Image" error={formErrors.poster?.[0]} />
                        <Input label="Trailer" type="url" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="Trailer" error={formErrors.trailer_url?.[0]} />
                        <Input label="Is Active" type="checkbox" value={isActive} onChange={(e) => setIsActive(e.target.checked)} placeholder="Is Active" error={formErrors.is_active?.[0]} />
                        <Button text="Save Movie" onClick={handleAddMovie} disabled={false} type="button" className="save-button" />
                    </form>
                    <div className={movieForm ? "catalogue-hidden" : "catalogue-visible"}>
                        {moviesList.length > 0 ? (
                            <div className="catalogue-grid">
                                {moviesList.map((movie) => (<MovieCard key={movie.id} movie={movie} onRefresh={fetchMovies} onSetMsg={setDisplayMsg} ratingOptions={ratingOptions} />))}
                            </div>)
                            : (<p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>No Movies found.</p>)}
                    </div>
                </main>
            </div>
        </>
    );
}
export default Movies;
