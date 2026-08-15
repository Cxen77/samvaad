import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ForumDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect legacy route /forums/:id to /forums/post/:id
        if (id) {
            navigate(`/forums/post/${id}`, { replace: true });
        } else {
            navigate('/forums', { replace: true });
        }
    }, [id, navigate]);

    return null;
};

export default ForumDetails;
