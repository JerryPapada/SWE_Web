import { useAuth } from "../context/Authorisation";
import Button from "../components/Button";
import { Link } from "react-router-dom";
function Header({ page, msg }) {
    const { user, logout, changePassword } = useAuth();


    return (

        <header className="main-header">
            <div className="header">
                <Link to="/home">
                    <img src="/logo.png" alt="logo" style={{ cursor: "pointer" }} />
                </Link>
                {page != "login" && page != "register" && (
                    <div className="header-container">

                        <div className="header-buttons">
                            <p>Hello, {user?.first_name}</p>
                            <Button text="Logout" onClick={logout} disabled={false} type="submit" className="button" />
                        </div>
                    </div>
                )}

            </div>
            <hr className="header-line" />
            {msg && (<div className={msg.includes('Success') ? 'header-success' : 'header-error'}>{msg}</div>)}
        </header>
    )
}

export default Header