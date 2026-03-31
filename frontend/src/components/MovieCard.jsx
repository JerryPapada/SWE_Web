import { useState } from 'react';
import { deleteMovie, updateMovie } from '../services/movieServices.js';
import Input from './Input';
import Select from './Select';
import { useAuth } from '../context/Authorisation';
import '../pages-css/MovieInfo.css';

function MovieCard({ movie, onRefresh, onSetMsg, ratingOptions }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editActive, setEditActive] = useState(movie.is_active);
    const [editRating, setEditRating] = useState(movie.rating);
    const [editTrailer, setEditTrailer] = useState('');
    const [editImage, setEditImage] = useState(null);

    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const toggleConfirm = () => setShowConfirm(!showConfirm);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditActive(movie.is_active);
            setEditRating(movie.rating || '');
            setEditTrailer(movie.trailer_url || '');
            setEditImage(null);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteMovie(movie.id);
            onSetMsg('Success! Movie deleted successfully!');
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to delete movie.");
        }
    };

    const handleUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('is_active', editActive);

            if (editRating) formData.append('rating', editRating);
            if (editTrailer) formData.append('trailer_url', editTrailer);
            if (editImage) formData.append('poster', editImage);

            await updateMovie(movie.id, formData);
            onSetMsg('Success! Movie updated!');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to update movie.");
        }
    };

    const getRatingLabel = (ratingValue) => {
        if (!ratingOptions || !ratingValue) return ratingValue;
        const option = ratingOptions.find(opt => opt.value === ratingValue);
        return option ? option.label : ratingValue;
    };

    return (
        <div className="card">
            <div className="card-image">
                <img src={movie.poster || '/logo.png'} alt={movie.title} />
                {!movie.is_active && <span className="inactive-badge">Inactive</span>}
            </div>
            <div className="card-info">
                {isEditing ? (
                    <div className="edit-form-inline">
                        <Input label="Movie Poster" type="file" accept=".jpg,.jpeg,.png,.svg" onChange={(e) => setEditImage(e.target.files[0])} />
                        <Input label="Trailer URL" type="url" value={editTrailer} onChange={(e) => setEditTrailer(e.target.value)} />
                        <Select label="Rating" value={editRating} onChange={(e) => setEditRating(e.target.value)} options={ratingOptions} />
                        <Input label="Is Active" type="checkbox" value={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        <div className="edit-actions-inline">
                            <button className="confirm-button yes" onClick={handleUpdate}>Save</button>
                            <button className="confirm-button no" onClick={toggleEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{movie.title}</h3>
                        <p className="card-items">Duration: {movie.duration_minutes} minutes</p>
                        <div className="movie-card-status">
                            <span>Rating: {getRatingLabel(movie.rating)}</span>
                            <span className={movie.is_active ? 'status-active' : 'status-inactive'}>
                                Status: {movie.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </>
                )}
            </div>
            <div className="card-actions">
                {!isEditing && (
                    !showConfirm ? (
                        <>
                            <button className={isAdmin ? "card-button edit" : "hide-card-button edit"} onClick={toggleEdit}>Edit</button>
                            <button className={isAdmin ? "card-button delete" : "hide-card-button delete"} onClick={toggleConfirm}>Delete</button>
                        </>
                    ) : (
                        <div className="confirm-delete-box">
                            <p>Are you sure?</p>
                            <div className="confirm-buttons">
                                <button className="confirm-button yes" onClick={handleConfirmDelete}>Yes</button>
                                <button className="confirm-button no" onClick={toggleConfirm}>No</button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default MovieCard;
