import { useState } from 'react';
import Button from './Button';

function ShowTicketWindow({ onClose, onSelectTickets, tickets }) {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleTicket = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(ticketId => ticketId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCheckIn = () => {
        const selected = tickets.filter(t => selectedIds.includes(t.id));
        onSelectTickets(selected);
    };

    return (
        <div className="scanner">
            <div className="scanner-window ticket-window-ext">
                <h2>Found Tickets</h2>

                <div className="tickets-list">
                    {tickets && tickets.length > 0 ? tickets.map((ticket) => (
                        <div key={ticket.id} className={`ticket-item ${ticket.checked_in ? 'checked-in' : ''}`}>
                            <div>
                                <h3 className="ticket-item-title">{ticket.movie_title}</h3>
                                <p className="ticket-item-info">{ticket.cinema_name} - {ticket.room_name}</p>
                                <p className="ticket-item-seat">Seat: {ticket.seat_number}</p>
                                <p className={`ticket-user ${ticket.checked_in ? 'checked-in' : ''}`}>
                                    {ticket.user_full_name} ({ticket.user_email}) {ticket.checked_in ? ' - ALREADY CHECKED IN' : ''}
                                </p>
                            </div>

                            {!ticket.checked_in && (
                                <input type="checkbox" checked={selectedIds.includes(ticket.id)} onChange={() => toggleTicket(ticket.id)} className="ticket-checkbox" />
                            )}
                        </div>
                    )) : <p>No tickets found.</p>}
                </div>

                <div className="ticket-actions">
                    <Button text={`Check In (${selectedIds.length})`} onClick={handleCheckIn} type="button" className="button save-button" disabled={selectedIds.length === 0} />
                    <Button text="Close" onClick={onClose} type="button" className="button" />
                </div>
            </div>
        </div>
    );
}

export default ShowTicketWindow;