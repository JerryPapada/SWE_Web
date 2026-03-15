import api from '../api/axios';

export const getRoomTypes = async () => {
    const response = await api.get('venues/rooms/room-types/');
    return response.data;
};

export const addRoomForm = async (cinema, name, capacity, rows, seatsPerRow, roomType, image, isActive) => {
    const formData = new FormData();
    formData.append('cinema_id', cinema);
    formData.append('name', name);
    formData.append('capacity', capacity);
    formData.append('rows', rows);
    formData.append('seats_per_row', seatsPerRow);
    formData.append('room_type', roomType);
    formData.append('photo', image);
    formData.append('is_active', isActive);
    debugger;
    const response = await api.post('venues/rooms/', formData);
    return response.data;
};

export const getRooms = async () => {
    debugger;
    const response = await api.get('venues/rooms/');
    return response.data;
};

export const deleteRoom = async (id) => {
    const response = await api.delete(`venues/rooms/${id}/`);
    return response.data;
};

export const updateRoom = async (id, data, image) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    if (image instanceof File) {
        formData.append('photo', image);
    }

    const response = await api.patch(`venues/rooms/${id}/`, formData);
    return response.data;
};
