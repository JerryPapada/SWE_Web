import { useState } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import { getRooms } from "../services/roomServices";
import { getMovies } from "../services/movieServices";
import { useEffect } from "react";
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useAuth } from "../context/Authorisation";
import { useNavigate } from "react-router-dom";
import { getCinemas } from "../services/cinemaServices";
import { addShowtime, getShowtimes } from "../services/showtimeServices";
import ShowtimeCard from "../components/ShowtimeCard";
import "../pages-css/Showtimes.css";

function Showtimes() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [showtimeForm, setShowtimeForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [movieOptions, setMovieOptions] = useState([]);
    const [roomOptions, setRoomOptions] = useState([]);
    const [movie, setMovie] = useState("");
    const [room, setRoom] = useState("");
    const [date, setDate] = useState("");
    const [availableSeats, setAvailableSeats] = useState("");
    const [price, setPrice] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [cinemaOptions, setCinemaOptions] = useState([]);
    const [showtimesList, setShowtimesList] = useState([]);
    const rolePermission = user?.role === 'ADMIN';


    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage();



    const handleShowtimeForm = () => {
        setShowtimeForm(!showtimeForm);
        setFormErrors({});
    };

    const fetchMovies = async () => {
        try {
            const data = await getMovies();
            setMovieOptions(data.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch movies!");
        }
    };

    const fetchRooms = async () => {
        try {
            const data = await getRooms();
            setRoomOptions(data.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch rooms!");
        }
    };
    const fetchCinemas = async () => {
        try {
            const data = await getCinemas();
            setCinemaOptions(data.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch cinemas!");
        }
    };

    const fetchShowtimes = async () => {
        try {
            const data = await getShowtimes();
            setShowtimesList(data.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch showtimes!");
        }
    };

    const handleAddShowtime = async () => {
        try {
            const data = await addShowtime(movie, room, date, price, isActive, availableSeats);
            setDisplayMsg('Success! A showtime has been added!');
            setShowtimeForm(false);
            setMovie("");
            setRoom("");
            setDate("");
            setAvailableSeats("");
            setPrice("");
            setIsActive(true);
            setFormErrors({});
            fetchShowtimes();
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to add showtime!");
                setFormErrors(errorData);
            }
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchMovies();
            fetchRooms();
            fetchCinemas();
            fetchShowtimes();
        }
    }, [user, navigate]);

    return (
        <>
            <Header page="showtimes" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{showtimeForm ? "Showtime Addition" : "Showtimes"}</h1>
                    <Button text="Back" onClick={handleShowtimeForm} type="button" className={showtimeForm ? "back-button" : "hidden"} />
                    <Button text="Add Showtime" onClick={handleShowtimeForm} disabled={false} type="button" className={!rolePermission || showtimeForm ? "hidden" : "add-button"} />
                    <form className={showtimeForm ? "open-add-form" : "close-add-form"}>
                        <Select label="Movie" value={movie} onChange={(e) => setMovie(e.target.value)} error={formErrors.movie_id?.[0]} options={movieOptions.map((movie) => ({ value: movie.id, label: movie.title }))} />
                        <Select label="Room" value={room} onChange={(e) => { setRoom(e.target.value); setAvailableSeats(roomOptions.find((room) => room.id === e.target.value)?.capacity); }} error={formErrors.room_id?.[0]} options={roomOptions.map((room) => ({ value: room.id, label: room.name + " - " + cinemaOptions.find((cinema) => cinema.id === room.cinema)?.name }))} />
                        <Input label="Date and Time" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date and Time" error={formErrors.start_time?.[0]} />
                        <Input label="Available Seats" type="number" value={availableSeats} disabled={true} placeholder="Available Seats" error={formErrors.available_seats?.[0]} />
                        <Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" error={formErrors.price?.[0]} />
                        <Input label="Is Active" type="checkbox" value={isActive} onChange={(e) => setIsActive(e.target.checked)} error={formErrors.is_active?.[0]} />
                        <Button text="Save Showtime" onClick={handleAddShowtime} disabled={false} type="button" className="save-button" />
                    </form>
                    <div className={showtimeForm ? "catalogue-hidden" : "catalogue-visible"}>
                        {showtimesList.length > 0 ? (
                            <div className="catalogue-grid">
                                {showtimesList.map((showtime) => {
                                    const matchingRoom = roomOptions.find((r) => r.id === showtime.room);
                                    const showtimeWithCapacity = { ...showtime, room_capacity: matchingRoom ? matchingRoom.capacity : "N/A" };
                                    return <ShowtimeCard key={showtime.id} showtime={showtimeWithCapacity} onRefresh={fetchShowtimes} onSetMsg={setDisplayMsg} />;
                                })}
                            </div>)
                            : (<p className="no-showtimes-message">No showtimes found.</p>)}
                    </div>
                </main>
            </div>
        </>
    );
}
export default Showtimes;