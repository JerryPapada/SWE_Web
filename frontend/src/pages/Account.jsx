import { useAuth } from '../context/Authorisation';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import { getUser } from '../services/userServices.js';
import { useEffect } from 'react';
import { updateUserForm } from '../services/userServices.js';
import { changePassword } from '../services/authServices.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

function Account() {
    const { user, setUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [formErrors, setFormErrors] = useState({});
    const rolePermission = user?.role === 'ADMIN' || user?.role === 'TICKET_MANAGER';

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [hasPassword, setHasPassword] = useState(false);
    const [settings, setSettings] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchUser();
        }
    }, [user, navigate]);

    const fetchUser = async () => {
        try {
            const data = await getUser();
            debugger;
            setUser(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setPhone(data.phone || '');
            setEmail(data.email || '');
            setHasPassword(data.has_password);
        } catch (error) {
            debugger;
            console.error("Failed to fetch user", error);
        }
    };

    const updateUser = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            debugger;
            await updateUserForm(firstName, lastName, phone);
            if (settings && (oldPassword && newPassword)) {
                await changePassword(oldPassword, newPassword);
                setSettings(false);
                setOldPassword('');
                setNewPassword('');
            }
            setDisplayMsg('Success! User info changed!');

        }
        catch (error) {
            debugger;
            if (error.response && error.response.data) {
                setFormErrors(error.response.data);
                setDisplayMsg('Some of the information you entered is incorrect!');
            }
            else if (error.response.status === 403) {
                setDisplayMsg('You do not have permission to perform this action!');
            } else if (error.response.status === 401) {
                navigate('/login', { state: { successMsg: 'You have logged out!' } });
            } else {
                setDisplayMsg('An error occurred!');
            }
        }
    }

    const openChangePasswordSettings = () => {
        setSettings(!settings);
    }

    return (
        <>
            <Header page="account" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>Account</h1>
                    <form className={"open-add-form"} onRefresh={fetchUser}>
                        <Input label="First Name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="" error={formErrors.first_name?.[0]} />
                        <Input label="Last Name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="" error={formErrors.last_name?.[0]} />
                        <Input label="Email" type="text" value={email} disabled={true} placeholder="" error={formErrors.email?.[0]} />
                        <Input label="Phone Number" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="" error={formErrors.phone?.[0]} />
                        <Button text="Change Password" onClick={openChangePasswordSettings} disabled={false} type="button" className={hasPassword ? "save-button" : "hidden"} />

                        {settings && (
                            <div className={"open-add-form"}>
                                <Input label="Old Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="" error={formErrors.old_password?.[0]} />
                                <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="" error={formErrors.new_password?.[0]} />
                            </div>
                        )}
                        <Button text="Save Changes" onClick={updateUser} disabled={false} type="button" className="save-button" />
                    </form>

                </main>
            </div>
        </>
    )
}

export default Account;