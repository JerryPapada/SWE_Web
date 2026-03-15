import api from '../api/axios';

export const addMovieForm = async (title, description, duration, genre, rating, director, poster, isActive, trailer) => {
    try {
        debugger;
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('duration_minutes', duration);
        formData.append('genre', genre);
        formData.append('rating', rating);
        formData.append('director', director);
        formData.append('poster', poster);
        formData.append('is_active', isActive);
        formData.append('trailer_url', trailer);

        const response = await api.post('venues/movies/', formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getMovies = async () => {
    debugger;
    const response = await api.get('venues/movies/');
    return response.data;
};

export const deleteMovie = async (id) => {
    const response = await api.delete(`venues/movies/${id}/`);
    return response.data;
};

export const updateMovie = async (id, data) => {
    const response = await api.patch(`venues/movies/${id}/`, data);
    return response.data;
};

export const getRatingOptions = async () => {
    const response = await api.get('venues/movies/rating-options/');
    return response.data;
};
