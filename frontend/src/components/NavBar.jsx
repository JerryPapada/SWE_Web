import { NavLink } from "react-router-dom";
import Button from "./Button";
import { useState } from "react";
function NavBar() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleNav = async (e) => {
        setIsOpen(!isOpen);
    }

    return (
        <>

            <nav className={isOpen ? "navbar-open" : "navbar-closed"}>
                <ul>
                    <label className="nav-label">Reservations</label>
                    <li><NavLink to="/">Reservations</NavLink></li>
                </ul>
                <ul>
                    <label className="nav-label">Tickets</label>
                    <li><NavLink to="/">Tickets</NavLink></li>
                </ul>
                <ul>
                    <label className="nav-label">User Management</label>
                    <li><NavLink to="/">Users</NavLink></li>
                </ul>
                <ul>
                    <label className="nav-label">Venues and Movies</label>
                    <li><NavLink to="/cinemas">Cinemas</NavLink></li>
                    <li><NavLink to="/">Movies</NavLink></li>
                    <li><NavLink to="/">Rooms</NavLink></li>
                    <li><NavLink to="/">Showtimes</NavLink></li>
                </ul>
            </nav>
            <Button text={isOpen ? "<<" : ">>"} onClick={toggleNav} disabled={false} type="button" className={isOpen ? "nav-button-open" : "nav-button-closed"} />
        </>
    );
}
export default NavBar