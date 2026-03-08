import Header from "../components/Header"
import Input from "../components/Input"
import Button from "../components/Button"
import Select from '../components/Select';
import "./Register.css"
import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fnameText, setFnameText] = useState('');
    const [lnameText, setLnameText] = useState('');
    const [role, setRole] = useState('');
    const [roleOptions, setRoleOptions] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const { register, getRoles } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const rolesData = await getRoles();
                setRoleOptions(rolesData);
                setRole(rolesData[2].value); //in this page we need only Regular Users
            } catch (error) {
                console.error("Failed to load roles.");
            }
        };
        fetchRoles();
    }, [getRoles]);

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setFormErrors({});

        try {
            await register({ email, password, password_confirm: confirmPassword, first_name: fnameText, last_name: lnameText, role });
            navigate('/login');
        } catch (error) {
            setFormErrors(error.response?.data || { detail: "Registration failed" });
        }
    };

    return (
        <>
            <Header page="register" />
            <div id="register-body">
                <h1 id="register-text">User Registration</h1>
                <div id="register-box">
                    <form id="register-form">
                        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" error={formErrors.email?.[0]} />
                        <Input label="First Name" type="text" value={fnameText} onChange={(e) => setFnameText(e.target.value)} placeholder="" error={formErrors.first_name?.[0]} />
                        <Input label="Last Name" type="text" value={lnameText} onChange={(e) => setLnameText(e.target.value)} placeholder="" error={formErrors.last_name?.[0]} />
                        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" error={formErrors.password?.[0]} />
                        <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="" error={formErrors.password_confirm?.[0]} />

                        <Select label="Select Role" value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />

                        <Button text="Register" disabled={false} type="submit" onClick={handleRegister} className="button" />
                    </form>
                </div>
            </div>
        </>
    );
}


export default Register
