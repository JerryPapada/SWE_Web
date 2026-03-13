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

export const getUser = async () => {
    const response = await api.get('users/profile/');
    return response.data;
};

export const updateUserForm = async (firstName, lastName, phone) => {
    const response = await api.patch('users/profile/', {
        first_name: firstName,
        last_name: lastName,
        phone: phone
    });
    return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
    });
    return response.data;
};

export const addUserForm = async (firstName, lastName, email, password, confirmPassword, phone, role, isActive) => {
    const response = await api.post('users/manage/', {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        password: password,
        password_confirm: confirmPassword,
        role: role,
        is_active: isActive
    });
    return response.data;
};

export const getUsers = async () => {
    debugger;
    const response = await api.get('users/manage/');
    return response.data;
};

export const deleteUserAdmin = async (id) => {
    const response = await api.delete(`users/manage/${id}/`);
    return response.data;
};

export const updateUserAdmin = async (id, data) => {
    const response = await api.patch(`users/manage/${id}/`, data);
    return response.data;
};
