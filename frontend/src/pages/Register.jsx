import Header from "../components/Header"
import Input from "../components/Input"
import Button from "../components/Button"
import "../pages-css/Register.css"
import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fnameText, setFnameText] = useState('');
    const [lnameText, setLnameText] = useState('');
    const [role] = useState('USER');
    const [formErrors, setFormErrors] = useState({});
    const { register } = useAuth();
    const navigate = useNavigate();


    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setFormErrors({});

        try {
            await register({ email, password, password_confirm: confirmPassword, first_name: fnameText, last_name: lnameText, role });
            navigate('/login', { state: { successMsg: 'Success: Registration completed successfully!' } });
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
                    {(formErrors.non_field_errors || formErrors.detail) && (
                        <p className="error-text-main">
                            {formErrors.non_field_errors?.[0] || formErrors.detail}
                        </p>
                    )}
                    <form id="register-form">
                        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" error={formErrors.email?.[0]} />
                        <Input label="First Name" type="text" value={fnameText} onChange={(e) => setFnameText(e.target.value)} placeholder="" error={formErrors.first_name?.[0]} />
                        <Input label="Last Name" type="text" value={lnameText} onChange={(e) => setLnameText(e.target.value)} placeholder="" error={formErrors.last_name?.[0]} />
                        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" error={formErrors.password?.[0]} />
                        <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="" error={formErrors.password_confirm?.[0]} />


                        <Button text="Register" disabled={false} type="submit" onClick={handleRegister} className="button" />
                    </form>
                </div>
            </div>
        </>
    );
}


export default Register
