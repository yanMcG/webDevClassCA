import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function MovieList() {
    let [movies, setMovies] = useState([]);
    let [loading, setLoading] = useState(true);
    let [error, setError] = useState(null);

    // form state for adding a movie
    let [form, setForm] = useState({ title: '', director: '', year: '', genre: '', rating: '' });

    let fetchMovies = useCallback(async (preferServer = true) => {
        setLoading(true);
        setError(null);
        let loaded = false;

        if (preferServer) {
            try {
                const res = await axios.get('http://localhost:3001/movies');
                setMovies(res.data || []);
                loaded = true;
            } catch (err) {
                console.warn('JSON Server fetch failed:', err.message);
            }
        }

        if (!loaded) {
            try {
                const res = await axios.get('/data/movies.json');
                setMovies(res.data || []);
                loaded = true;
            } catch (err) {
                console.warn('/data/movies.json fetch failed:', err.message);
            }
        }

        if (!loaded) {
            try {
                let mod = await import('../data/movies.json');
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const addMovie = async (evt) => {
        if (evt && evt.preventDefault) evt.preventDefault();
        setError(null);

        const newMovie = {
            title: form.title || `New Movie ${movies.length + 1}`,
            director: form.director || 'Unknown',
            year: parseInt(form.year) || new Date().getFullYear(),
            genre: form.genre || 'Unknown',
            rating: parseFloat(form.rating) || 0
        };

        try {
            const res = await axios.post('http://localhost:3001/movies', newMovie);
            // if server responded, refresh from server
            if (res && res.status >= 200 && res.status < 300) {
                fetchMovies(true);
                setForm({ title: '', director: '', year: '', genre: '', rating: '' });
                return;
            }
        } catch (err) {
            console.warn('POST to JSON Server failed, adding locally:', err.message);
            // fallback: add locally to state with a generated id
            const maxId = movies.reduce((max, m) => Math.max(max, m.id || 0), 0);
            setMovies(prev => [...prev, { id: maxId + 1, ...newMovie }]);
            setForm({ title: '', director: '', year: '', genre: '', rating: '' });
            setError('JSON Server not reachable — movie added locally only.');
        }
    };

    const deleteMovie = async (id) => {
        setError(null);
        try {
            const res = await axios.delete(`http://localhost:3001/movies/${id}`);
            if (res && res.status >= 200 && res.status < 300) {
                fetchMovies(true);
                return;
            }
        } catch (err) {
            console.warn('DELETE to JSON Server failed, removing locally:', err.message);
            setMovies(prev => prev.filter(m => m.id !== id));
            setError('JSON Server not reachable — movie removed locally only.');
        }
    };

    if (loading) return <div id="movieList">Loading movies...</div>;

    return (
        <div id="movieList">
            <h2>Movies</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>Total: {movies.length}</p>

            <form onSubmit={addMovie} style={{ marginBottom: 16 }}>
                <input name="title" placeholder="Title" value={form.title} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="director" placeholder="Director" value={form.director} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="year" placeholder="Year" value={form.year} onChange={handleChange} style={{ width:80, marginRight:8 }} />
                <input name="genre" placeholder="Genre" value={form.genre} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="rating" placeholder="Rating" value={form.rating} onChange={handleChange} style={{ width:80, marginRight:8 }} />
                <button type="submit">Add Movie</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {movies.map(m => (
                    <li key={m.id} style={{ margin: '10px 0', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
                        <h4>{m.title} ({m.year})</h4>
                        <p><strong>Director:</strong> {m.director}</p>
                        <p><strong>Genre:</strong> {m.genre} | <strong>Rating:</strong> {m.rating}/10</p>
                        <div>
                            <button onClick={() => deleteMovie(m.id)} style={{ backgroundColor:'#c00', color:'#fff', border:'none', padding:'6px 10px', borderRadius:4, cursor:'pointer' }}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}