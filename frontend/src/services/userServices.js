import api from '../api/axios';

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
