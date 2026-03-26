import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import { getTicketsByShowtime } from '../services/ticketServices';
import '../pages-css/Showtimes.css';

function ShowtimeReservationsModal({ showtimeId, onClose, movieTitle, roomName }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await getTicketsByShowtime(showtimeId);
            setTickets(data.results || data);
            setLoading(false);
        } catch (error) {
            setErrorMsg("Failed to load tickets.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [showtimeId]);


    const checkedInCount = tickets.filter(t => t.checked_in).length;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Reservations for {movieTitle}</h2>
                <p className="modal-subtitle">{roomName}</p>

                <div className="occupancy-stats">
                    <strong>Check-Ins:</strong> <span className="stats-highlight">{checkedInCount} / {tickets.length} total tickets</span>
                </div>
                {errorMsg && <p className="error-message modal-error">{errorMsg}</p>}
                {loading ? (
                    <p className="modal-text-white">Loading tickets...</p>
                ) : (
                    <div className="tickets-list">
                        {tickets.length === 0 ? (
                            <p className="modal-text-white">No reservations found for this showtime.</p>
                        ) : (
                            <table className="tickets-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Seat</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td>{ticket.user_full_name}</td>
                                            <td>{ticket.user_email}</td>
                                            <td>{ticket.seat_number}</td>
                                            <td>
                                                <span className={ticket.checked_in ? "status-active" : "status-inactive"}>
                                                    {ticket.checked_in ? "Yes" : "No"}
                                                </span>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                <div className="modal-actions">
                    <Button className="confirm-button no" onClick={onClose} text="Close" type="button" />
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ShowtimeReservationsModal;
