import { useAuth } from '../context/Authorisation';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TicketCard from "../components/TicketCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import '../pages-css/ReservationStep.css';


function ReservationStep4() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [formErrors, setFormErrors] = useState({});
    const { reservationResponse } = location.state || {};


    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);

    const tickets = reservationResponse?.tickets || [];

    return (
        <>
            <Header page="reservations-step-4" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <div>
                        <h1>Reservation Step 4</h1>
                        <h2 className="step-instructions">Your Tickets</h2>
                        <div className="ticket-list-container">
                        {Array.isArray(tickets) ? (
                            tickets.map((ticket) => (
                                <TicketCard key={ticket.id} ticket={ticket} />
                            ))
                        ) : (
                            <TicketCard ticket={tickets} />
                        )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    )

}
export default ReservationStep4