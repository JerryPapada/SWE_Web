import api from '../api/axios';

export const saveCinemaForm = async (cinemaName, description, address, city, phoneNumber, email, image, active) => {

    const formData = new FormData();
    formData.append('name', cinemaName);
    formData.append('description', description);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('phone', phoneNumber);
    formData.append('email', email);
    formData.append('is_active', active);
    if (image) {
        formData.append('photo', image);
    }
    const response = await api.post('venues/cinemas/', formData);

    return response.data;
};

export const getCinemas = async () => {
    const response = await api.get('venues/cinemas/');
    return response.data;
};

export const deleteCinema = async (id) => {
    const response = await api.delete(`venues/cinemas/${id}/`);
    return response.data;
};

export const updateCinema = async (id, data) => {
    const response = await api.patch(`venues/cinemas/${id}/`, data);
    return response.data;
};
