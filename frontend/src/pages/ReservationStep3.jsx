import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../context/Authorisation';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Input from "../components/Input";
import '../pages-css/ReservationStep.css';
import { setReservation } from '../services/reservationService';

function ReservationStep3() {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedShowTime, selectedMovie, cinema, room, selectedSeats } = location.state || {};
    const { user } = useAuth();
    const seatsArray = selectedSeats ? Array.from(selectedSeats) : [];

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);
    const [sendEmail, setSendEmail] = useState(false);


    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else if (!selectedShowTime || !selectedSeats || seatsArray.length === 0) {
            navigate('/reservations-step-1');
        }
    }, [user, navigate, selectedShowTime, selectedSeats]);

    const handleConfirmReservation = async () => {
        try {
            debugger;
            const reservationResponse = await setReservation(selectedShowTime.id, seatsArray.length, seatsArray, sendEmail);
            debugger;
            navigate('/reservations-step-4', { state: { ...location.state, reservationResponse, successMsg: "Success! Your reservation has been confirmed!" } });
        } catch (error) {
            setDisplayMsg("There was a problem with the reservation. Please try again.")
        }
    };

    const dateObj = new Date(selectedShowTime.start_time);
    const formattedDate = isNaN(dateObj) ? '' : dateObj.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = isNaN(dateObj) ? '' : dateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const totalPrice = (seatsArray.length * selectedShowTime.price).toFixed(2);

    return (
        <>
            <Header page="reservations-step-3" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <div>
                        <h1>Reservation Step 3</h1>
                        <h2 className="step-instructions">Ticket Confirmation</h2>
                        <Button className="back-button" text="Back" onClick={() => navigate('/reservations-step-2', { state: location.state })} />
                        <div className="ticket-summary">
                            <div className="ticket-movie-info">
                                <h3 className="ticket-title">{selectedShowTime.movie_title}</h3>
                                <div className="showtime-badges">
                                    {!selectedShowTime.is_3d && !selectedShowTime.is_imax && !selectedShowTime.is_dolby_atmos && <span className="badge badge-2d">2D</span>}
                                    {selectedShowTime.is_3d && <span className="badge badge-3d">3D</span>}
                                    {selectedShowTime.is_imax && <span className="badge badge-imax">IMAX</span>}
                                    {selectedShowTime.is_dolby_atmos && <span className="badge badge-atmos">DOLBY ATMOS</span>}
                                </div>
                            </div>

                            <div className="ticket-confirmation">
                                <div className="ticket-item">
                                    <span>Cinema</span>
                                    <span>{cinema || selectedShowTime.cinema_name}</span>
                                </div>
                                <div className="ticket-item">
                                    <span>Room</span>
                                    <span>
                                        {Array.isArray(room) ? room[0]?.name : (room?.name || selectedShowTime.room_name)}
                                    </span>
                                </div>
                                <div className="ticket-item">
                                    <span>Date</span>
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="ticket-item">
                                    <span>Time</span>
                                    <span>{formattedTime}</span>
                                </div>
                                <div className="ticket-item ticket-seats-item">
                                    <span>Selected Seats</span>
                                    <span className="selected-seats-text">
                                        {seatsArray.join(', ')}
                                    </span>
                                </div>
                            </div>

                            <div className="ticket-price-section">
                                <div>
                                    <span>Tickets ({seatsArray.length} x €{selectedShowTime.price})</span>
                                    <span>€{totalPrice}</span>
                                </div>
                                <hr />
                                <div>
                                    <span>Total Amount</span>
                                    <span>€{totalPrice}</span>
                                </div>
                            </div>
                            <div className="email-confirmation">
                                <Input type="checkbox" label="Send tickets via email" value={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                            </div>
                        </div>
                        <Button className="save-button ticket-submit" type="button" text="Confirm & Pay" onClick={handleConfirmReservation} />
                    </div>
                </main>
            </div>
        </>
    );
}

export default ReservationStep3;