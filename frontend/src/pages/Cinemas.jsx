import { useAuth } from '../context/Authorisation';
import Header from '../components/Header';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { useState, useEffect } from 'react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Textarea from '../components/Textarea.jsx';
import CinemaCard from '../components/CinemaCard.jsx';
import { saveCinemaForm, getCinemas } from '../services/cinemaServices.js';

function Cinemas() {

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [cinemaForm, setCinemaForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [cinemaName, setCinemaName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [active, setIsActive] = useState(false);
    const [cinemasList, setCinemasList] = useState([]);
    const rolePermission = user?.role === 'ADMIN';

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
        } else {
            fetchCinemas();
        }
    }, [user, navigate]);

    const handleCinemaForm = () => {
        setCinemaForm(!cinemaForm);
        setCinemaName('');
        setDescription('');
        setAddress('');
        setCity('');
        setPhoneNumber('');
        setEmail('');
        setImage('');
        setIsActive(false);
    }
    const addCinema = async (e) => {
        e.preventDefault();
        setFormErrors({});
        try {
            await saveCinemaForm(cinemaName, description, address, city, phoneNumber, email, image, active);
            setCinemaForm(false);
            setDisplayMsg('Success! A cinema has been added!');
            fetchCinemas();
        }
        catch (error) {
            debugger;
            if (error.response.status === 403) {
                setDisplayMsg('You do not have permission to perform this action!');
            } else if (error.response.status === 401) {
                navigate('/login', { state: { successMsg: 'You have logged out!' } });
            } else {
                setDisplayMsg('An error occurred!');
            }
            setFormErrors(error.response.data);
        }
    }

    const fetchCinemas = async () => {
        try {
            const data = await getCinemas();
            const actualList = data.results ? data.results : data;
            setCinemasList(actualList);
        } catch (error) {
            console.error("Failed to fetch cinemas", error);
        }
    };


    return (
        <>
            <Header page="cinemas" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>{cinemaForm ? "Cinema Addition" : "Cinemas"}</h1>
                    <Button text="Back" onClick={handleCinemaForm} type="button" className={cinemaForm ? "back-button" : "hidden"} />
                    <Button text="Add Cinema" onClick={handleCinemaForm} disabled={false} type="button" className={!rolePermission || cinemaForm ? "hidden" : "add-button"} />
                    <form className={cinemaForm ? "open-add-form" : "close-add-form"}>
                        <Input label="Cinema's Name" type="text" value={cinemaName} onChange={(e) => setCinemaName(e.target.value)} placeholder="Name" error={formErrors.name?.[0]} />
                        <Textarea label="Description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="" error={formErrors.description?.[0]} />
                        <Input label="Address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" error={formErrors.address?.[0]} />
                        <Input label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" error={formErrors.city?.[0]} />
                        <Input label="Phone Number" type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" error={formErrors.phoneNumber?.[0]} />
                        <Input label="Email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" error={formErrors.email?.[0]} />
                        <Input key={cinemaForm} label="Image" type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setImage(e.target.files[0])} placeholder="Image" error={formErrors.image?.[0]} />
                        <Input label="Is Active" type="checkbox" value={active} onChange={(e) => setIsActive(e.target.checked)} placeholder="Is Active" error={formErrors.isActive?.[0]} />
                        <Button text="Save Cinema" onClick={addCinema} disabled={false} type="button" className="save-button" />
                    </form>
                    <div className={cinemaForm ? "catalogue-hidden" : "catalogue-visible"}>
                        {cinemasList.length > 0 ? (
                            <div className="catalogue-grid">
                                {cinemasList.map((cinema) => (<CinemaCard key={cinema.id} cinema={cinema} onRefresh={fetchCinemas} onSetMsg={setDisplayMsg} />))}
                            </div>)
                            : (<p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>No cinemas found.</p>)}
                    </div>
                </main>
            </div>
        </>
    );
}
export default Cinemas