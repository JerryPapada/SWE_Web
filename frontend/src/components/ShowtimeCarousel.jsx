import '../pages-css/ReservationStep.css';

function ShowtimeCarousel({ showTimes, cinema, selectedMovie, selectShowTime, selectedShowTime }) {

    const availableShowTimes = showTimes.filter((st) => String(st.cinema_name) === String(cinema));

    return (
        <div className="carousel-container">
            {availableShowTimes.length > 0 ? (
                availableShowTimes.map((showtime) => {
                    const dateStr = showtime.date || showtime.datetime || showtime.start_time;
                    const dateObj = new Date(dateStr);
                    const isInvalidDate = isNaN(dateObj.getTime());
                    const today = new Date();
                    if (!isInvalidDate && dateObj < today) {
                        return null;
                    }

                    const formattedDate = isInvalidDate ? dateStr : dateObj.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'short' });
                    const formattedTime = isInvalidDate ? '' : dateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });

                    return (
                        <div key={showtime.id} className="carousel-item" onClick={() => selectShowTime(showtime)}>
                            <div className={`home-card ${selectedShowTime?.id === showtime.id ? 'selected-card' : ''} showtime-card`}>
                                <div className="home-card-info showtime-card-info">
                                    <h3 className="showtime-date">
                                        {formattedDate}
                                    </h3>
                                    <h2 className="showtime-time">
                                        {formattedTime}
                                    </h2>
                                    <p className="showtime-room">
                                        {showtime.room_name}
                                    </p>
                                    <p className="showtime-price">
                                        {showtime.price ? `€${showtime.price}` : ''}
                                    </p>
                                    <div className="showtime-badges">
                                        {!showtime.is_3d && !showtime.is_imax && !showtime.is_dolby_atmos && <span className="badge badge-2d">2D</span>}
                                        {showtime.is_3d && <span className="badge badge-3d">3D</span>}
                                        {showtime.is_imax && <span className="badge badge-imax">IMAX</span>}
                                        {showtime.is_dolby_atmos && <span className="badge badge-atmos">DOLBY ATMOS</span>}
                                    </div>
                                    {showtime.available_seats !== undefined && (
                                        <p className={`showtime-seats ${showtime.available_seats > 5 ? 'showtime-seats-plenty' : 'showtime-seats-few'}`}>
                                            {showtime.available_seats} Seats Left
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="showtime-empty-msg">No available showtimes for this cinema.</p>
            )}
        </div>
    );
}

export default ShowtimeCarousel;
