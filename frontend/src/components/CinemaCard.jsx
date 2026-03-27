import { useState } from 'react';
import { deleteCinema, updateCinema } from '../services/cinemaServices.js';
import Input from './Input';
import { useAuth } from '../context/Authorisation';
function CinemaCard({ cinema, onRefresh, onSetMsg }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(cinema.name);
    const [editActive, setEditActive] = useState(cinema.is_active);
    const { user } = useAuth();
    const rolePermission = user?.role === 'ADMIN';

    const Confirm = () => setShowConfirm(!showConfirm);
    const toggleEdit = () => {
        setIsEditing(!isEditing);
        setEditName(cinema.name);
        setEditActive(cinema.is_active);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteCinema(cinema.id);
            onSetMsg('Cinema deleted successfully!');
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to delete cinema. You might not have permission.");
        }
    };

    const handleUpdate = async () => {
        try {
            await updateCinema(cinema.id, {
                name: editName,
                is_active: editActive
            });
            onSetMsg('Success! Cinema updated!');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to update cinema. You might not have permission.");
        }
    };
    return (
        <div className="card">
            <div className="card-image">
                <img src={cinema.photo || '/logo.svg'} alt={cinema.name} />
                {!cinema.is_active && <span className="inactive-badge">Inactive</span>}
            </div>
            <div className="card-info">
                {isEditing ? (
                    <div className="edit-form-inline">
                        <Input
                            label="Name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <Input
                            label="Is Active"
                            type="checkbox"
                            value={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                        />
                        <div className="edit-actions-inline">
                            <button className="confirm-button yes" onClick={handleUpdate}>Save</button>
                            <button className="confirm-button no" onClick={toggleEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{cinema.name}</h3>
                        <p className="card-items"> {cinema.city}, {cinema.address}</p>
                        <div>
                            <span> {cinema.rooms_count} Rooms</span>
                        </div>
                    </>
                )}
            </div>
            <div className="card-actions">
                {!isEditing && (
                    !showConfirm ? (
                        <>{ }
                            <button className={rolePermission ? "card-button edit" : "hide-card-button edit"} onClick={toggleEdit}>Edit</button>
                            <button className={rolePermission ? "card-button delete" : "hide-card-button delete"} onClick={Confirm}>Delete</button>
                        </>
                    ) : (
                        <div className="confirm-delete-box">
                            <p>Are you sure?</p>
                            <div className="confirm-buttons">
                                <button className="confirm-button yes" onClick={handleConfirmDelete}>Yes</button>
                                <button className="confirm-button no" onClick={Confirm}>No</button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
export default CinemaCard;