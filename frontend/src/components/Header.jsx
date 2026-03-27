import { useAuth } from "../context/Authorisation";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
function Header({ page, msg }) {
    const navigate = useNavigate();
    const { user, logout, changePassword } = useAuth();


    return (

        <header className="main-header">
            <div className="header">
                <Link to="/home">
                    <img src="/logo.png" alt="logo" />
                </Link>
                {page != "login" && page != "register" && (
                    <div className="header-container">
                        {user ? (
                            <div className="header-buttons">
                                <p>Hello, {user.first_name}</p>
                                <Button text="Logout" onClick={() => logout(navigate)} disabled={false} type="submit" className="button" />
                            </div>
                        ) : (
                            <div className="header-buttons">
                                <Link to="/login"><Button text="Login" disabled={false} type="submit" className="button" /></Link>
                                <Link to="/register"><Button text="Register" disabled={false} type="submit" className="button" /></Link>
                            </div>
                        )}
                    </div>
                )}

            </div>
            <hr className="header-line" />
            {msg && (<div className={msg.includes('Success') ? 'header-success' : 'header-error'}>{msg}</div>)}
        </header>
    )
}

export default Header