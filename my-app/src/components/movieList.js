import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function MovieList() {
    let [movies, setMovies] = useState([]);
    let [loading, setLoading] = useState(true);
    let [error, setError] = useState(null);

    let fetchMovies = useCallback(async (preferServer = true) => {
        setLoading(true);
        setError(null);
        let loaded = false;

       

        if (!loaded) {
            // Final fallback: dynamic import from src (works because build includes it)
            try {
                let mod = await import('../data/movies.json');
                // Some bundlers expose default, others export the array directly
                setMovies(mod.default || mod);
                loaded = true;
            } catch (err) {
                console.error('Dynamic import fallback failed:', err.message);
                setError('Unable to load movies from JSON Server or local files.');
            }
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMovies(true);
    }, [fetchMovies]);

    if (loading) return <div id="movieList">Loading movies...</div>;
   

    return (
        <div id="movieList">
            <h2>Movies</h2>
            <p>Total: {movies.length}</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {movies.map(m => (
                    <li key={m.id} style={{ margin: '10px 0', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
                        <h4>{m.title} ({m.year})</h4>
                        <p><strong>Director:</strong> {m.director}</p>
                        <p><strong>Genre:</strong> {m.genre} | <strong>Rating:</strong> {m.rating}/10</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}