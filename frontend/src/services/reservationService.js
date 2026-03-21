import api from '../api/axios';

export const setReservation = async (showtimeId, numberOfTickets, seats) => {
    try {
        debugger;
        const response = await api.post('reservations/', {
            showtime: showtimeId,
            num_seats: numberOfTickets,
            seat_numbers: seats
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getReservationsSeats = async (showtimeId) => {
    try {
        const response = await api.get(`reservations/${showtimeId}/seats/`);
        debugger;
        return response.data;
    } catch (error) {
        throw error;
    }
}
