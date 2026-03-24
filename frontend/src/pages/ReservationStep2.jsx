import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from '../context/Authorisation';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import { getRoom } from "../services/roomServices";
import '../pages-css/ReservationStep.css';
import SeatsBox from "../components/SeatsBox";
import Button from "../components/Button";
import { getReservationsSeats } from "../services/reservationService";
function ReservationStep2() {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedShowTime, selectedMovie, cinema } = location.state || {};
    const [room, setRoom] = useState([]);
    const { user } = useAuth();
    const [formErrors, setFormErrors] = useState({});
    const [reservation, setReservation] = useState({});
    const [selectedSeats, setSelectedSeats] = useState(new Set());
    const [unavailableSeats, setUnavailableSeats] = useState([]);

    const getRoomSeats = async () => {
        try {
            debugger;
            const response = await getRoom(selectedShowTime.room_name, selectedShowTime.cinema_name);
            const roomData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            if (roomData.length > 1) {
                throw new Error('Multiple rooms found with the same name and cinema');
            }
            setRoom(roomData || []);
        } catch (error) {
            setDisplayMsg('Error fetching the room!');

        }
    };

    const selectSeats = (seat) => {
        const newSelectedSeats = new Set(selectedSeats);
        if (newSelectedSeats.has(seat)) {
            newSelectedSeats.delete(seat);
        } else {
            newSelectedSeats.add(seat);
        }
        setSelectedSeats(newSelectedSeats);
    }
    const getUnavailableSeats = async () => {
        try {
            debugger;
            const response = await getReservationsSeats(selectedShowTime.id);
            const allSeatsData = Array.isArray(response) ? response : (response?.results || []);
            const reservedSeats = allSeatsData.filter(seat => seat.is_reserved).map(seat => seat.seat_number);
            setUnavailableSeats(reservedSeats);
        } catch (error) {
            setDisplayMsg('Error fetching the unavailable seats!');

        }
    };

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else if (selectedShowTime) {
            getRoomSeats();
            getUnavailableSeats();
        }
    }, [user, selectedShowTime]);

    const nextStep = () => {
        //TODO NA TSEKARO AN OI THESEIS INE PIASMENES IDI
        navigate('/reservations-step-3', { state: { selectedShowTime, selectedMovie, cinema, room, selectedSeats } });
    }


    return (
        <>
            <Header page="reservations-step-2" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <Button className="back-button" text="Back" onClick={() => navigate('/reservations-step-1', { state: location.state })} />
                    <h1>{"Reservation 2st"}</h1>
                    <h2 className="step-instructions">Choose seats</h2>
                    <div className="seat-info">
                        <div className="available-count">
                            Available Seats: <strong>{selectedShowTime.available_seats > 0 ? selectedShowTime.available_seats - selectedSeats.size : 0}</strong>
                        </div>
                        <div className="seat-legend">
                            <span className="legend-item">
                                <button className="seat-button-for-show"></button> Available
                            </span>
                            <span className="legend-item">
                                <button className="seat-button-for-show selected-seat"></button> Selected
                            </span>
                            <span className="legend-item">
                                <button className="seat-button-for-show taken-seat"></button> Unavailable
                            </span>
                        </div>
                    </div>
                    <div className="seat-layout">
                        {room.length > 0 ? (
                            <SeatsBox room={room} showtime={selectedShowTime} selectSeats={selectSeats} unavailableSeats={unavailableSeats} selectedSeats={selectedSeats} />
                        ) : (
                            <p>Loading seats...</p>
                        )}
                    </div>
                    <div className={selectedSeats.size > 0 ? "open-next-step" : "hidden"}>
                        <Button onClick={() => nextStep()} type="submit" className="save-button" text="Next Step -&gt;">   </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
export default ReservationStep2