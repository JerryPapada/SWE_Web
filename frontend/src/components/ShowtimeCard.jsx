import { useState } from 'react';
import { deleteShowtime, updateShowtime } from '../services/showtimeServices.js';
import Input from './Input';
import { useAuth } from '../context/Authorisation';
import Button from './Button';
import ShowtimeReservationsModal from './ShowtimeReservationWindow.jsx';
import '../pages-css/ReservationStep.css';
import '../pages-css/Showtimes.css';
function ShowtimeCard({ showtime, onRefresh, onSetMsg }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showReservations, setShowReservations] = useState(false);

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
    const isAdminOrTicketManager = user?.role === 'ADMIN' || user?.role === 'TICKET_MANAGER';
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
            onSetMsg('Success!Showtime deleted successfully!');
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
                        <h3 className="edit-heading">Editing: {showtime.movie_title}</h3>
                        <p className="card-items edit-subheading">{showtime.cinema_name} - {showtime.room_name}</p>
                        <Input label="Date and Time" type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                        <Input label="Price" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                        <Input label="Is Active" type="checkbox" value={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        <div className="edit-actions-inline">
                            <Button className="confirm-button yes" onClick={handleUpdate} text="Save" type="button" />
                            <Button className="confirm-button no" onClick={toggleEdit} text="Cancel" type="button" />
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{showtime.movie_title}</h3>
                        <div className="card-details">
                            <p>{showtime.cinema_name} - {showtime.room_name}</p>
                            <p>Date: {new Date(showtime.start_time).toLocaleString()}</p>
                            <p>Price: € {showtime.price}</p>
                            <p>Room Capacity: {showtime.room_capacity}</p>
                            <p>Available Seats: {showtime.available_seats}</p>
                        </div>

                        <div className="showtime-badges">
                            {!showtime.is_3d && !showtime.is_imax && !showtime.is_dolby_atmos && <span className="badge badge-2d">2D</span>}
                            {showtime.is_3d && <span className="badge badge-3d">3D</span>}
                            {showtime.is_imax && <span className="badge badge-imax">IMAX</span>}
                            {showtime.is_dolby_atmos && <span className="badge badge-atmos">DOLBY ATMOS</span>}
                        </div>

                        <div>
                            <span className={showtime.is_active ? 'status-active' : 'status-inactive'}>
                                Status: {showtime.is_active ? 'Active' : 'Inactive'}
                            </span>

                        </div>
                    </>
                )}
            </div>
            <div className="card-actions">
                {!isEditing && !showConfirm && (
                    <>
                        {isAdminOrTicketManager && (
                            <Button className="card-button info" onClick={() => setShowReservations(true)} text="Reservations" type="button" />
                        )}
                        {isAdmin && (
                            <>
                                <Button className="card-button edit" onClick={toggleEdit} text="Edit" type="button" />
                                <Button className="card-button delete" onClick={toggleConfirm} text="Delete" type="button" />
                            </>
                        )}
                    </>
                )}

                {!isEditing && showConfirm && (
                    <div className="confirm-delete-box">
                        <p>Are you sure?</p>
                        <div className="confirm-buttons">
                            <Button className="confirm-button yes" onClick={handleConfirmDelete} text="Yes" type="button" />
                            <Button className="confirm-button no" onClick={toggleConfirm} text="No" type="button" />
                        </div>
                    </div>
                )}
            </div>

            {showReservations && (
                <ShowtimeReservationsModal showtimeId={showtime.id} movieTitle={showtime.movie_title} roomName={`${showtime.cinema_name} - ${showtime.room_name}`} onClose={() => setShowReservations(false)} />
            )}
        </div>
    );
}

export default ShowtimeCard;
