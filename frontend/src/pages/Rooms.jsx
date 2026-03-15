import Select from "../components/Select";
import { useAuth } from '../context/Authorisation';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useState, useEffect } from 'react';
import Input from '../components/Input.jsx';
import { getCinemas } from '../services/cinemaServices.js';
import { getRoomTypes, addRoomForm, getRooms } from '../services/roomServices.js';
import RoomCard from '../components/RoomCard';


function Rooms() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const rolePermission = user?.role === 'ADMIN';
    const [roomForm, setRoomForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isActive, setIsActive] = useState(false);
    const [cinema, setCinema] = useState("");
    const [cinemasList, setCinemasList] = useState([]);
    const [cinemaOptions, setCinemaOptions] = useState([]);
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [rows, setRows] = useState('');
    const [seatsPerRow, setSeatsPerRow] = useState('');
    const [roomType, setRoomType] = useState('');
    const [image, setImage] = useState('');
    const [roomTypesList, setRoomTypesList] = useState([]);
    const [roomsList, setRoomsList] = useState([]);

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    const [displayMsg, setDisplayMsg] = useTimedMessage(successMessage);



    const handleRoomForm = () => {
        setRoomForm(!roomForm);
    }
    const fetchCinemas = async () => {
        debugger;
        try {
            const cinemasData = await getCinemas();
            setCinemasList(cinemasData.results);
            setCinemaOptions(cinemasData.results.map(cinema => ({ value: cinema.id, label: cinema.name })));
        } catch (error) {
            debugger;
            setDisplayMsg("Failed to fetch cinemas!");
        }
    };
    const fetchRoomTypes = async () => {
        try {
            const roomTypesData = await getRoomTypes();
            setRoomTypesList(roomTypesData.results);
        } catch (error) {
            setDisplayMsg("Failed to fetch room types!");
        }
    };
    const handleAddRoom = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            await addRoomForm(cinema, name, capacity, rows, seatsPerRow, roomType, image, isActive);
            setRoomForm(false);
            setDisplayMsg('Success! A room has been added!');
            setName('');
            setCapacity('');
            setRows('');
            setSeatsPerRow('');
            setRoomType('');
            setImage('');
            setIsActive(false);
            fetchRooms();
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to add room!");
                setFormErrors(errorData);
            }
        }
    };
    const fetchRooms = async () => {
        try {
            const roomsData = await getRooms();
            setRoomsList(roomsData.results);
        } catch (error) {
            const errorData = error.response?.data || {};
            if (errorData.non_field_errors) {
                setDisplayMsg(errorData.non_field_errors[0]);
                setFormErrors({ ...errorData, name: errorData.non_field_errors });
            } else {
                setDisplayMsg("Failed to fetch rooms!");
                setFormErrors(errorData);
            }
        }
    };
    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { successMsg: 'You have logged out!' } });
        } else {
            fetchCinemas();
            fetchRoomTypes();
            fetchRooms();
        }
    }, [user, navigate]);

    return (
        <>
            <Header page="rooms" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{roomForm ? "Room Addition" : "Rooms"}</h1>
                    <Button text="Back" onClick={handleRoomForm} type="button" className={roomForm ? "back-button" : "hidden"} />
                    <Button text="Add Room" onClick={handleRoomForm} disabled={false} type="button" className={!rolePermission || roomForm ? "hidden" : "add-button"} />
                    <form className={roomForm ? "open-add-form" : "close-add-form"}>
                        <Select label="Cinema" value={cinema.id} onChange={(e) => setCinema(e.target.value)} error={formErrors.cinema?.[0]} options={cinemaOptions} />
                        <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" error={formErrors.name?.[0]} />
                        <Input label="Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity" error={formErrors.capacity?.[0]} />
                        <Input label="Rows" type="number" value={rows} onChange={(e) => setRows(e.target.value)} placeholder="Rows" error={formErrors.rows?.[0]} />
                        <Input label="Seats per Row" type="number" value={seatsPerRow} onChange={(e) => setSeatsPerRow(e.target.value)} placeholder="Seats per Row" error={formErrors.seatsPerRow?.[0]} />
                        <Select label="Room Type" value={roomType} onChange={(e) => setRoomType(e.target.value)} error={formErrors.roomType?.[0]} options={roomTypesList} placeholder="Room Type" />
                        <Input key={roomForm} label="Image" type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setImage(e.target.files[0])} placeholder="Image" error={formErrors.image?.[0]} />
                        <Input label="Is Active" type="checkbox" value={isActive} onChange={(e) => setIsActive(e.target.checked)} placeholder="Is Active" error={formErrors.is_active?.[0]} />
                        <Button text="Save Room" onClick={handleAddRoom} disabled={false} type="button" className="save-button" />
                    </form>
                    <div className={roomForm ? "catalogue-hidden" : "catalogue-visible"}>
                        {roomsList.length > 0 ? (
                            <div className="catalogue-grid">
                                {roomsList.map((room) => (<RoomCard key={room.id} room={room} onRefresh={fetchRooms} onSetMsg={setDisplayMsg} roomTypesList={roomTypesList} />))}
                            </div>)
                            : (<p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>No Rooms found.</p>)}
                    </div>
                </main>
            </div>
        </>
    );
}
export default Rooms