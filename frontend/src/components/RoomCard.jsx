import { useState } from 'react';
import { deleteRoom, updateRoom } from '../services/roomServices.js';
import Input from './Input';
import { useAuth } from '../context/Authorisation';
import '../pages-css/Rooms.css';

function RoomCard({ room, onRefresh, onSetMsg, roomTypesList }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editActive, setEditActive] = useState(room.is_active);
    const [editImage, setEditImage] = useState(null);

    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const toggleConfirm = () => setShowConfirm(!showConfirm);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditActive(room.is_active);
            setEditImage(null);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteRoom(room.id);
            onSetMsg('Room deleted successfully!');
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to delete room.");
        }
    };

    const handleUpdate = async () => {
        try {
            const data = {
                is_active: editActive
            };

            await updateRoom(room.id, data, editImage);
            onSetMsg('Success! Room updated!');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to update room.");
        }
    };

    const getRoomTypeLabel = (typeValue) => {
        if (!roomTypesList) return typeValue;
        const option = roomTypesList.find(opt => opt.value === typeValue);
        return option ? option.label : typeValue;
    };

    return (
        <div className="card">
            <div className="card-image">
                <img src={room.photo || '/logo.png'} alt={room.name} />
                {isAdmin && !room.is_active && <span className="inactive-badge">Inactive</span>}
            </div>
            <div className="card-info">
                {isEditing ? (
                    <div className="edit-form-inline">
                        <Input label="Room Photo" type="file" accept=".jpg,.jpeg,.png,.svg" onChange={(e) => setEditImage(e.target.files[0])} />
                        <Input label="Is Active" type="checkbox" value={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        <div className="edit-actions-inline">
                            <button className="confirm-button yes" onClick={handleUpdate}>Save</button>
                            <button className="confirm-button no" onClick={toggleEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{room.cinema_name} - {room.name}</h3>
                        <p className="card-items">Capacity: {room.capacity} seats</p>
                        <div className="room-card-status">
                            <span>Type: {getRoomTypeLabel(room.room_type)}</span>
                            {isAdmin && (
                                <span className={room.is_active ? 'status-active' : 'status-inactive'}>
                                    Status: {room.is_active ? 'Active' : 'Inactive'}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
            <div className="card-actions">
                {!isEditing && !showConfirm && (
                    <>
                        {isAdmin && <button className="card-button edit" onClick={toggleEdit}>Edit</button>}
                        {isAdmin && <button className="card-button delete" onClick={toggleConfirm}>Delete</button>}
                    </>
                )}
                {!isEditing && showConfirm && (
                    <div className="confirm-delete-box">
                        <p>Are you sure?</p>
                        <div className="confirm-buttons">
                            <button className="confirm-button yes" onClick={handleConfirmDelete}>Yes</button>
                            <button className="confirm-button no" onClick={toggleConfirm}>No</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoomCard;
