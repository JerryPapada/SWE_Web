import { useState } from 'react';
import { deleteUserAdmin, updateUserAdmin } from '../hooks/FormsRecuests.js';
import Input from './Input';
import Select from './Select';
import { useAuth } from '../context/Authorisation';

function UserCard({ user: userData, onRefresh, onSetMsg, roleOptions }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFirstName, setEditFirstName] = useState(userData.first_name);
    const [editLastName, setEditLastName] = useState(userData.last_name);
    const [editRole, setEditRole] = useState(userData.role);
    const [editPhone, setEditPhone] = useState(userData.phone || '');
    const [editActive, setEditActive] = useState(userData.is_active);
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';

    const toggleConfirm = () => setShowConfirm(!showConfirm);

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditFirstName(userData.first_name);
            setEditLastName(userData.last_name);
            setEditRole(userData.role);
            setEditPhone(userData.phone || '');
            setEditActive(userData.is_active);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteUserAdmin(userData.id);
            onSetMsg('User deleted successfully!');
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to delete user.");
        }
    };

    const handleUpdate = async () => {
        try {
            await updateUserAdmin(userData.id, { first_name: editFirstName, last_name: editLastName, role: editRole, phone: editPhone, is_active: editActive });
            onSetMsg('Success! User updated!');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            onSetMsg("Failed to update user.");
        }
    };

    const getRoleLabel = (roleValue) => {
        const option = roleOptions.find(opt => opt.value === roleValue);
        return option ? option.label : roleValue;
    };

    return (
        <div className="card">
            <div className="card-info">
                {isEditing ? (
                    <div className="edit-form-inline">
                        <Input label="First Name" type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                        <Input label="Last Name" type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                        <Input label="Phone" type="number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                        <Select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value)} options={roleOptions} />
                        <Input label="Is Active" type="checkbox" value={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        <div className="edit-actions-inline">
                            <button className="confirm-button yes" onClick={handleUpdate}>Save</button>
                            <button className="confirm-button no" onClick={toggleEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3>{userData.first_name} {userData.last_name}</h3>
                        <p className="card-items">Email: {userData.email}</p>
                        <p className="card-items">Phone: {userData.phone || 'N/A'}</p>
                        <div>
                            <span>Role: {getRoleLabel(userData.role)}</span>
                            <span style={{ color: userData.is_active ? '#22c55e' : '#ef4444', marginLeft: '1rem' }}>
                                Status: {userData.is_active ? 'Active' : 'Inactive'}
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

export default UserCard;
