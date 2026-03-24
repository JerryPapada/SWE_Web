import React from 'react';

function TicketCard({ ticket }) {
    if (!ticket) return null;

    const dateObj = new Date(ticket.showtime);
    const formattedDate = isNaN(dateObj) ? '' : dateObj.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = isNaN(dateObj) ? '' : dateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Ensure the QR code has a proper base URL (adjust if needed depending on environment)
    const qrCodeUrl = ticket.qr_code?.startsWith('http') 
        ? ticket.qr_code 
        : `http://localhost:8000${ticket.qr_code}`;

    return (
        <article className="ticket-card">
            <header>
                <h3>{ticket.movie_title}</h3>
            </header>
            <section>
                <dl>
                    <div>
                        <dt>Cinema</dt>
                        <dd>{ticket.cinema_name}</dd>
                    </div>
                    <div>
                        <dt>Room</dt>
                        <dd>{ticket.room_name}</dd>
                    </div>
                    <div>
                        <dt>Date & Time</dt>
                        <dd>{formattedDate} <br /> {formattedTime}</dd>
                    </div>
                    <div>
                        <dt>Seat</dt>
                        <dd className="seat-value">{ticket.seat_number}</dd>
                    </div>
                </dl>
                {ticket.qr_code && (
                    <figure>
                        <img src={qrCodeUrl} alt="QR Code" />
                    </figure>
                )}
            </section>
        </article>
    );
}

export default TicketCard;
