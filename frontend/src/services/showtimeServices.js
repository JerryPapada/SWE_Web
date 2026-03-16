import api from '../api/axios';

export const addShowtime = async (movie, room, date, price, isActive, availableSeats) => {
    const data = {
        movie_id: movie,
        room_id: room,
        start_time: date,
        price: parseFloat(price),
        is_active: isActive,
        available_seats: parseInt(availableSeats, 10)
    };

    const response = await api.post('venues/showtimes/', data);
    return response.data;
};

export const getShowtimes = async () => {
    const response = await api.get('venues/showtimes/');
    return response.data;
};

export const getShowtime = async (id) => {
    const response = await api.get(`venues/showtimes/${id}/`);
    return response.data;
};

export const updateShowtime = async (id, movie, room, date, price, isActive, availableSeats) => {
    const data = {
        movie_id: movie,
        room_id: room,
        start_time: date,
        price: parseFloat(price),
        is_active: isActive,
        available_seats: parseInt(availableSeats, 10)
    };

    const response = await api.put(`venues/showtimes/${id}/`, data);
    return response.data;
};

export const deleteShowtime = async (id) => {
    const response = await api.delete(`venues/showtimes/${id}/`);
    return response.data;
};
