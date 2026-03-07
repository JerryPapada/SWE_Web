import Header from "../components/Header"
import Input from "../components/Input"
import Button from "../components/Button"
import "./Login.css"
import { useState } from 'react';
import api from '../api/axios'
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/Authorisation';
import { useNavigate } from 'react-router-dom';

function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const { login, loginWithGoogle } = useAuth();

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            await login(email, password);
            navigate('/');
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
                await loginWithGoogle(tokenResponse.access_token);
                navigate('/');
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
        <><Header page="login" />
            <div id="login-body">
                <div id="login-box">
                    <p id="login-welcome-text">Sign up or Log in</p>
                    {(formErrors.non_field_errors || formErrors.detail) && (
                        <p className="error-text-main">
                            {formErrors.non_field_errors?.[0] || formErrors.detail}
                        </p>
                    )}
                    <Input label="Insert Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" error={formErrors.email?.[0]} />
                    <Input label="Insert Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" error={formErrors.password?.[0]} />
                    <Button text="Login" onClick={handleLogin} disabled={false} type="submit" className="button" />
                    <p id="login-or">OR</p>
                    <Button text="Login with Google" onClick={googleLogin} disabled={false} type="submit" className="button" />
                    <p id="login-or">If you don't have an Account</p>
                    <Button text="Register" onClick={userRegistration} disabled={false} type="submit" className="button" />
                </div>
            </div>
        </>
    )
}
export default Login
