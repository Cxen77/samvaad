import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useStories = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStories = async () => {
        try {
            const { data } = await api.get('/stories');
            setStories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const createStory = async (text, images = []) => {
        try {
            const { data } = await api.post('/stories', { text, images });
            setStories(prev => [data, ...prev]);
            return data;
        } catch (err) {
            throw err;
        }
    };

    const deleteStory = async (storyId) => {
        try {
            await api.delete(`/stories/${storyId}`);
            setStories(prev => prev.filter(story => story._id !== storyId));
        } catch (err) {
            console.error("Failed to delete story:", err);
            throw err;
        }
    };

    return { stories, loading, createStory, deleteStory, refreshStories: fetchStories };
};
