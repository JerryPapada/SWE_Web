

import { useAuth } from '../context/Authorisation';
import Header from '../components/Header';
import { useTimedMessage } from "../hooks/HeaderMessage.js";
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
function Home() {

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    let successMessage;
    if (location.state && location.state.successMsg) {
        successMessage = location.state.successMsg;
    } else {
        successMessage = null;
    }
    let [displayMsg] = useTimedMessage(successMessage);

    if (!user)
        navigate('/login', { state: { successMsg: 'You have logged out!' } });


    return (
        <>
            <Header page="home" msg={displayMsg} />
            <div className="page-layout">
                <NavBar />
                <main className="page-content">
                    <h1>Welcome to the Dashboard</h1>
                </main>
            </div>
        </>
    );
}
export default Home