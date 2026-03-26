import api from '../api/axios';

export const setReservation = async (showtimeId, numberOfTickets, seats, sendEmail = false) => {
    try {
        const response = await api.post('reservations/', {
            showtime: showtimeId,
            num_seats: numberOfTickets,
            seat_numbers: seats,
            send_email: sendEmail
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getReservationsSeats = async (showtimeId) => {
    try {
        const response = await api.get(`venues/showtimes/${showtimeId}/seats/`);
        return response.data;
    } catch (error) {
        throw error;
    }
}
