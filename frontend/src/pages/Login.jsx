import Header from "../components/Header"
import Input from "../components/Input"
import Button from "../components/Button"
import "../pages-css/Login.css"
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import { useTimedMessage } from "../hooks/HeaderMessage.js";

function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }

    let [displayMsg] = useTimedMessage(successMessage);



    const handleLogin = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            const user = await login(email, password);
            navigate('/home');
        }
        catch (error) {
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (!data.email && !data.password && !data.non_field_errors && !data.detail) {
                    setFormErrors({ detail: "You entered invalid credentials or there is a problem with the connection." });
                } else {
                    setFormErrors(data);
                }
            } else {
                setFormErrors({ detail: "You entered invalid credentials" });
            }
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const user = await loginWithGoogle(tokenResponse.access_token);
                navigate('/home');
            } catch (error) {
                setFormErrors({ detail: "There was an error during the connection with Google." });
            }
        },
        onError: () => setFormErrors({ detail: 'Login Failed' }),
    });

    const userRegistration = async (e) => {
        navigate('/register');

    }

    return (
        <><Header page="login" msg={displayMsg} />
            <div id="login-body">
                <h1 id="login-welcome-text">Sign up or Log in</h1>
                <div id="login-box">
                    {(formErrors.non_field_errors || formErrors.detail) && (
                        <p className="error-text-main">
                            {formErrors.non_field_errors?.[0] || formErrors.detail}
                        </p>
                    )}
                    <Input label="Insert Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" error={formErrors.email?.[0]} />
                    <Input label="Insert Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" error={formErrors.password?.[0]} />
                    <Button text="Login" onClick={handleLogin} disabled={false} type="submit" className="button" />
                    <p id="login-or">OR</p>
                    <Button text="Login with Google" onClick={googleLogin} disabled={false} type="submit" className="button google-button" />
                    <p id="login-or">If you don't have an Account</p>
                    <Button text="Register" onClick={userRegistration} disabled={false} type="submit" className="button" />
                </div>
            </div>
        </>
    )
}
export default Login
