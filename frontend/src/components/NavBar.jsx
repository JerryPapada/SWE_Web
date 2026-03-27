import { NavLink } from "react-router-dom";
import Button from "./Button";
import { useState } from "react";
import { useAuth } from '../context/Authorisation';
function NavBar() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const toggleNav = async (e) => {
        setIsOpen(!isOpen);
    }
    debugger;
    const showAdminPage = user?.role === "ADMIN";
    const showVisitorPage = user?.role === undefined;
    const showTicketManagerPage = user?.role === "TICKET_MANAGER";
    return (
        <>

            <nav className={isOpen ? "navbar-open" : "navbar-closed"}>
                <ul>
                    <li><NavLink to="/home">Home</NavLink></li>
                    <li><NavLink to="/reservations-step-1">Reservations</NavLink></li>
                    <li className={showAdminPage || showTicketManagerPage ? "" : "hidden"}><NavLink to="/check-in">Check-In</NavLink></li>
                    <li className={showAdminPage ? "" : "hidden"}><NavLink to="/users">Users</NavLink></li>
                    <li><NavLink to="/cinemas">Cinemas</NavLink></li>
                    <li><NavLink to="/rooms">Rooms</NavLink></li>
                    <li className={showAdminPage ? "" : "hidden"}><NavLink to="/movies">Movies</NavLink></li>
                    <li className={showAdminPage || showTicketManagerPage ? "" : "hidden"}><NavLink to="/showtimes">Showtimes</NavLink></li>
                </ul>
                <ul className="nav-bottom-list">
                    <li className={showVisitorPage ? "hidden" : ""}><NavLink to="/account">My Account</NavLink></li>
                </ul>
            </nav>
            <Button text={isOpen ? "<<" : ">>"} onClick={toggleNav} disabled={false} type="button" className={isOpen ? "nav-button-open" : "nav-button-closed"} />
        </>
    );
}
export default NavBar