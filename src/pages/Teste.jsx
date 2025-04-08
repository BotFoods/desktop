import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Teste = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then((response) => response.json())
            .then((data) => {
                setCategories(data);
            })
            .catch((error) => console.error('Error fetching categories:', error));
    }, []);

    return (
        <div>
            <h1>Teste</h1>
            <p>Current Location: {location.pathname}</p>
        </div>
    );
}

export default Teste;