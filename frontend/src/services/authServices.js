import api from '../api/axios';

export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
    });
    return response.data;
};
