
import { useAuth } from "../context/Authorisation";
import Button from "../components/Button";
function Header({ page, msg }) {
    const { user, logout, changePassword } = useAuth();
    //Se periptosi pou exei kanei login na ftiaxo ena strogillo me to onoma tou xristi


    return (

        <header className="main-header">
            <div className="header">
                <h1 className="header-logo">Director’s Cut</h1>
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