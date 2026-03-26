import api from '../api/axios';

export const changePassword = async (oldPassword, newPassword, newPasswordConfirm) => {
    const response = await api.post('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
    });
    return response.data;
};
