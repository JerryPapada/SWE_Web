import { useState } from 'react';
import { deleteShowtime, updateShowtime } from '../services/showtimeServices.js';
import Input from './Input';
import { useAuth } from '../context/Authorisation';

function ShowtimeCard({ showtime, onRefresh, onSetMsg }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const formatForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const [editDate, setEditDate] = useState(formatForInput(showtime.start_time));
    const [editPrice, setEditPrice] = useState(showtime.price);
    const [editActive, setEditActive] = useState(showtime.is_active);

    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const toggleConfirm = () => setShowConfirm(!showConfirm);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditDate(formatForInput(showtime.start_time));
            setEditPrice(showtime.price);
            setEditActive(showtime.is_active);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteShowtime(showtime.id);
            onSetMsg('Showtime deleted successfully!');
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to delete showtime.");
        }
    };

    const handleUpdate = async () => {
        try {
            const isoDate = new Date(editDate).toISOString();

            await updateShowtime(
                showtime.id,
                showtime.movie,
                showtime.room,
                isoDate,
                editPrice,
                editActive,
                showtime.available_seats
            );
            onSetMsg('Success! Showtime updated!');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to update showtime.");
        }
    };

    return (
        <div className="card">
            <div className="card-info">
                {isEditing ? (
                    <div className="edit-form-inline">
                        <Input label="Date and Time" type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                        <Input label="Price" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                        <Input label="Is Active" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        <div className="edit-actions-inline">
                            <button className="confirm-button yes" onClick={handleUpdate}>Save</button>
                            <button className="confirm-button no" onClick={toggleEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{showtime.movie_title}</h3>
                        <p className="card-items" style={{ marginBottom: "0.5rem" }}>{showtime.cinema_name} - {showtime.room_name}</p>
                        <p className="card-items" style={{ marginBottom: "0.5rem" }}>Date: {new Date(showtime.start_time).toLocaleString()}</p>
                        <p className="card-items" style={{ marginBottom: "0.5rem" }}>Price: € {showtime.price}</p>
                        <p className="card-items" style={{ marginBottom: "0.5rem" }}>Available Seats: {showtime.available_seats}</p>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {!showtime.is_3d && !showtime.is_imax && !showtime.is_dolby_atmos && <span style={{ backgroundColor: '#94a3b8', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>2D</span>}
                            {showtime.is_3d && <span style={{ backgroundColor: '#22d3ee', color: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>3D</span>}
                            {showtime.is_imax && <span style={{ backgroundColor: '#ec4899', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>IMAX</span>}
                            {showtime.is_dolby_atmos && <span style={{ backgroundColor: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>DOLBY ATMOS</span>}
                        </div>

                        <div>
                            <span style={{ color: showtime.is_active ? '#22c55e' : '#ef4444' }}>
                                Status: {showtime.is_active ? 'Active' : 'Inactive'}
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
                    ) : (<div className="confirm-delete-box">
                        <p>Are you sure?</p>
                        <div className="confirm-buttons">
                            <button className="confirm-button yes" onClick={handleConfirmDelete}>Yes</button>
                            <button className="confirm-button no" onClick={toggleConfirm}>No</button>
                        </div>
                    </div>)
                )}
            </div>
        </div>
    );
}

export default ShowtimeCard;
