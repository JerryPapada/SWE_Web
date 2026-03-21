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
                    <li><NavLink to="/home">Home</NavLink></li>
                    <li><NavLink to="/reservations-step-1">Reservations</NavLink></li>
                    <li><NavLink to="/">Tickets</NavLink></li>
                    <li><NavLink to="/users">Users</NavLink></li>
                    <li><NavLink to="/cinemas">Cinemas</NavLink></li>
                    <li><NavLink to="/rooms">Rooms</NavLink></li>
                    <li><NavLink to="/movies">Movies</NavLink></li>
                    <li><NavLink to="/showtimes">Showtimes</NavLink></li>
                </ul>
                <ul style={{ marginTop: "4rem", marginBottom: "2rem" }}>
                    <li><NavLink to="/account">My Account</NavLink></li>
                </ul>
            </nav>
            <Button text={isOpen ? "<<" : ">>"} onClick={toggleNav} disabled={false} type="button" className={isOpen ? "nav-button-open" : "nav-button-closed"} />
        </>
    );
}
export default NavBar