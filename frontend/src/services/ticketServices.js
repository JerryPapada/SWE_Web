import api from '../api/axios';

export const getTicketsByShowtime = async (showtimeId) => {
    const response = await api.get('tickets/', {
        params: { reservation__showtime: showtimeId }
    });
    return response.data;
};

export const checkInTicket = async (ticketId) => {
    const response = await api.post('tickets/checkin/', { ticket_id: ticketId });
    return response.data;
};

export const searchReservationVisitor = async (email, phone) => {
    const payload = {};
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    const response = await api.post('tickets/visitor-search/', payload);
    return response.data;
};

export const checkInByQR = async (qrData) => {
    const response = await api.post('tickets/checkin/', { qr_data: qrData });
    return response.data;
};

export const searchTicketsByEmail = async (email) => {
    const response = await api.post('tickets/search/', { email: email });
    return response.data;
};

export const searchTicketsByPhone = async (phone) => {
    const response = await api.post('tickets/search/', { phone: phone });
    return response.data;
};
