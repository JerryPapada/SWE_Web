import { useAuth } from '../context/Authorisation';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useState, useEffect } from 'react';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import { addUserForm, getUsers } from '../hooks/FormsRecuests.js';
import UserCard from '../components/UserCard.jsx';

function Users() {

    const { user, getRoles } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [userForm, setUserForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const rolePermission = user?.role === 'ADMIN' || user?.role === 'TICKET_MANAGER';
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [roleOptions, setRoleOptions] = useState([]);
    const [usersList, setUsersList] = useState([]);


    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);

    if (!user)
        navigate('/login', { state: { successMsg: 'You have logged out!' } });

    const handleUserForm = () => {
        setUserForm(!userForm);
    }

    const fetchUsers = async () => {
        try {
            const usersData = await getUsers();
            debugger;
            setUsersList(usersData.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch users!");
        }
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getRoles();
                setRoleOptions(rolesData);
            } catch (error) {
                setDisplayMsg("Failed to fetch roles!");
            }
        };
        fetchRoles();
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            await addUserForm(firstName, lastName, email, password, confirmPassword, phone, role, isActive);
            setUserForm(false);
            setDisplayMsg('Success! A user has been added!');
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            setRole('');
            handleUserForm();
            fetchUsers();
        } catch (error) {
            if (error.response.status === 403) {
                setDisplayMsg('You do not have permission to perform this action!');
            } else if (error.response.status === 401) {
                navigate('/login', { state: { successMsg: 'You have logged out!' } });
            } else {
                setDisplayMsg('An error occurred!');
            }
            setFormErrors(error.response.data);
        }
    }

    return (
        <>
            <Header page="users" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{userForm ? "User Addition" : "Users"}</h1>
                    <Button text="Back" onClick={handleUserForm} type="button" className={userForm ? "back-button" : "hidden"} />
                    <Button text="Add User" onClick={handleUserForm} disabled={false} type="button" className={!rolePermission || userForm ? "hidden" : "add-button"} />
                    <form className={userForm ? "open-add-form" : "close-add-form"}>
                        <Input label="First Name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" error={formErrors.first_name?.[0]} />
                        <Input label="Last Name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" error={formErrors.last_name?.[0]} />
                        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" error={formErrors.email?.[0]} />
                        <Input label="Phone" type="number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" error={formErrors.phone?.[0]} />
                        <Input label="Password" type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} placeholder="Password" error={formErrors.password?.[0]} />
                        <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" error={formErrors.password_confirm?.[0]} />
                        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} error={formErrors.role?.[0]} options={roleOptions} placeholder="Role" />
                        <Input label="Is Active" type="checkbox" value={isActive} onChange={(e) => setIsActive(e.target.checked)} placeholder="Is Active" error={formErrors.is_active?.[0]} />
                        <Button text="Add User" onClick={handleAddUser} disabled={false} type="button" className="save-button" />
                    </form>
                    <div className={userForm ? "catalogue-hidden" : "catalogue-visible"}>
                        {usersList.length > 0 ? (
                            <div className="catalogue-grid">
                                {usersList.map((usr) => (<UserCard key={usr.id} user={usr} onRefresh={fetchUsers} onSetMsg={setDisplayMsg} roleOptions={roleOptions} />))}
                            </div>)
                            : (<p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>No Users found.</p>)}
                    </div>
                </main>
            </div>
        </>
    )
}

export default Users;