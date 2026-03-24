import '../pages-css/ReservationStep.css';

function SeatsBox({ room, showtime, selectSeats, unavailableSeats, selectedSeats }) {

    const rows = room[0].rows;
    const seatsPerRow = room[0].seats_per_row;
    const date = new Date(showtime.start_time);
    const formattedDate = date.toLocaleDateString('el-GR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return (
        <>
            <div className="seats-header">
                <h2>{room.name}</h2>
            </div>

            <div className="seats-box">
                <div className="screen"><p>Screen</p></div>
                {Array.from({ length: rows }).map((_, i) => {
                    const rowLetter = String.fromCharCode(65 + i);
                    return (
                        <div key={`row-${i}`} className="seat-row">
                            <span className="row-letter">{rowLetter}</span>
                            {Array.from({ length: seatsPerRow }).map((_, j) => (
                                <span key={`seat-${i}-${j}`} className="seat">
                                    <button 
                                        className={`seat-button ${selectedSeats.has(`${rowLetter}${j + 1}`) ? 'selected-seat' : ''} ${unavailableSeats.includes(`${rowLetter}${j + 1}`) ? 'taken-seat' : ''}`} 
                                        type="button" 
                                        id={`seat-${i}-${j}`} 
                                        value={`${rowLetter}${j + 1}`} 
                                        onClick={() => selectSeats(`${rowLetter}${j + 1}`)}
                                        disabled={unavailableSeats.includes(`${rowLetter}${j + 1}`)}
                                    ></button>
                                </span>
                            ))}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
export default SeatsBox