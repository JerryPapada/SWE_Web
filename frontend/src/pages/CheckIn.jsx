import Header from "../components/Header";
import NavBar from "../components/NavBar";
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useAuth } from '../context/Authorisation';
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/Button.jsx";
import QrCodeScanner from "../components/qrCodeScanner.jsx";
import ShowTicketWindow from "../components/ShowTicketWindow.jsx";
import '../pages-css/CheckIn.css';
import Input from "../components/Input.jsx";
import { useState } from "react";
import { checkInByQR, searchTicketsByEmail, searchTicketsByPhone, checkInTicket } from "../services/ticketServices";

function CheckIn() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showScanner, setShowScanner] = useState(false);
    let [emailOrPhoneForm, setEmailOrPhoneForm] = useState(false);
    let [email, setEmail] = useState('');
    let [phone, setPhone] = useState('');
    let [tickets, setTickets] = useState([]);
    let [formErrors, setFormErrors] = useState({});
    let [showTicketWindow, setShowTicketWindow] = useState(false);
    let [selectedTickets, setSelectedTickets] = useState([]);
    const rolePermission = user?.role === "ADMIN" || user?.role === "TICKET_MANAGER";
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
        } else if (!rolePermission) {
            navigate('/home', { state: { successMsg: 'You do not have permission to access this page!' } });
        }
    }, [user, navigate]);

    const openQRScanner = () => {
        setShowScanner(!showScanner);
    }

    const openTicketWindow = () => {
        setShowTicketWindow(!showTicketWindow);
    }

    const handleCheckInByQR = async (qrData) => {
        try {
            const response = await checkInByQR(qrData);
            setDisplayMsg("Success! Check-in completed!");
            setShowScanner(false);
        } catch (error) {
            setShowScanner(false);
            setDisplayMsg("Error! Check-in failed!");
        }
    }

    const handleSelectTickets = async (selectedTickets) => {
        try {
            let successCount = 0;
            for (const ticket of selectedTickets) {
                await checkInTicket(ticket.id);
                successCount++;
            }
            setDisplayMsg(`Success! Checked in ${successCount} tickets successfully.`);
            setShowTicketWindow(false);
        } catch (error) {
            setDisplayMsg("Error! Failed to check in some tickets.");
        }
    }

    const handleCheckInByEmailOrPhone = () => {
        setEmailOrPhoneForm(!emailOrPhoneForm);
    }

    const handleFindTickets = async () => {
        if (email.length > 0) {
            const response = await searchTicketsByEmail(email);
            if (response.length === 0) {
                setDisplayMsg("No tickets found for this email!");
            } else {
                setTickets(response.tickets);
                openTicketWindow();
            }
        }
        else if (phone.length > 0) {
            const response = await searchTicketsByPhone(phone);
            if (response.length === 0) {
                setDisplayMsg("No tickets found for this phone!");
            } else {
                setTickets(response.tickets);
                openTicketWindow();
            }
        }

    }
    return (
        <>
            <Header page="check-in" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>Check In</h1>
                    <div className={`check-in-options ${emailOrPhoneForm ? 'window-extention' : ''}`}>
                        <Button text="Scan QR" onClick={openQRScanner} disabled={false} type="button" className="button" />
                        <p>OR</p>
                        <Button text="Find Tickets By Email Or Phone" onClick={handleCheckInByEmailOrPhone} disabled={false} type="button" className="button" />
                        <form className={emailOrPhoneForm ? "open-add-form" : "close-add-form"}>
                            <Input label="Email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" error={formErrors.email?.[0]} />
                            <p>OR</p>
                            <Input label="Phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" error={formErrors.phone?.[0]} />
                            <Button text="Find Tickets" onClick={handleFindTickets} disabled={false} type="button" className="button" />
                        </form>
                    </div>
                    {showScanner && (<QrCodeScanner onClose={() => setShowScanner(false)} onScanSuccess={(resultText) => { handleCheckInByQR(resultText); }} onScanError={(errMessage) => { setShowScanner(false); setDisplayMsg("Scanner Error: " + errMessage); }} />)}
                    {showTicketWindow && (<ShowTicketWindow tickets={tickets} onClose={() => setShowTicketWindow(false)} onSelectTickets={(selectedTickets) => { handleSelectTickets(selectedTickets); }} />)}
                </main>
            </div>
        </>
    )
}
export default CheckIn