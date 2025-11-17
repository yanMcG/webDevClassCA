import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import styles from './contactList.module.css';

export default function ContactList() {
    let [contacts, setcontacts] = useState([]);
    let [loading, setLoading] = useState(true);
    let [error, setError] = useState(null);

    // form state for adding a contact
    let [form, setForm] = useState({ name: '', email: '', phone: '', address: '', age: '' });

    // search-by-ID state
    let [searchId, setSearchId] = useState('');
    let [searchResult, setSearchResult] = useState(null);
    let [searchError, setSearchError] = useState(null);

    // show Indiana contacts
    let [showIndiana, setShowIndiana] = useState(false);

    // sort state: 'none' | 'asc' | 'desc'
    let [sortOrder, setSortOrder] = useState('none');

    let fetchcontacts = useCallback(async (preferServer = true) => {
        setLoading(true);
        setError(null);
        let loaded = false;

        // try to load from JSON Server first
        if (preferServer) {
            try {
                let res = await axios.get('http://localhost:3002/contacts');
                setcontacts(res.data || []);
                loaded = true;
            } catch (err) {
                console.warn('JSON Server fetch failed:', err.message);
            }
        }
        // fallback: load from public/data/contacts.json
        if (!loaded) {
            try {
                let res = await axios.get('/data/contacts.json');
                setcontacts(res.data.contacts || []);
                loaded = true;
            } catch (err) {
                console.warn('/data/contacts.json fetch failed:', err.message);
            }
        }
        // final fallback: dynamic import (for environments where /data/contacts.json is not served)
        if (!loaded) {
            try {
                let mod = await import('../data/contacts.json');
                setcontacts(mod.default.contacts || mod.contacts || []);
                loaded = true;
            } catch (err) {
                console.error('Dynamic import fallback failed:', err.message);
                setError('Unable to load contacts from JSON Server or local files.');
            }
        }

        setLoading(false);
    }, []);

    // initial load
    useEffect(() => {
        // fetch contacts from server or local file
        fetchcontacts(true);
    }, [fetchcontacts]);

    // handle form field changes
    let handleChange = (e) => {
        let { name, value } = e.target;
        // update form state
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // add contact function
    let addContact = async (evt) => {
        if (evt && evt.preventDefault) evt.preventDefault();
        setError(null);

        //create object of new contacts information
        let newContact = {
            name: form.name || `Contact ${contacts.length + 1}`,
            email: form.email || 'unknown@example.com',
            phone: form.phone || 'N/A',
            address: form.address || 'N/A',
            age: parseInt(form.age, 10) || 0,

            //get contacts.json length then add 1 for new contacts
            id: contacts.length + 1
        };

        // post to add contacts information to server
        try {
            let res = await axios.post('http://localhost:3002/contacts', newContact);
            // if server responded, refresh from server
            if (res && res.status >= 200 && res.status < 300) {
                fetchcontacts(true);
                setForm({ name: '', email: '', phone: '', address: '', age: '' });
                return;
            }
        } catch (err) {
            console.warn('POST to JSON Server failed, adding locally:', err.message);
            // fallback: add locally to state with a generated id
            let maxId = contacts.reduce((max, c) => Math.max(max, c.id || 0), 0);
            setcontacts(prev => [...prev, { id: maxId + 1, ...newContact }]);
            setForm({ name: '', email: '', phone: '', address: '', age: '' });
            setError('JSON Server not reachable — contact added locally only.');
        }
    };

    // search by ID function
    let searchById = async (evt) => {
        if (evt && evt.preventDefault) evt.preventDefault();
        setSearchError(null);
        setSearchResult(null);
        //handles error if user tries to enter a non digit number for ID
        let id = parseInt(searchId, 10);
        if (Number.isNaN(id)) {
            setSearchError('Please enter a valid numeric ID.');
            return;
        }

        try {
            let res = await axios.get(`http://localhost:3002/contacts/${id}`);
            // JSON Server returns the object directly
            if (res && res.status >= 200 && res.status < 300) {
                setSearchResult(res.data || null);
                return;
            }
        // fallback: search locally
        } catch (err) {
            console.warn('Lookup on server failed, falling back to local search:', err.message);
            let found = contacts.find(c => c.id === id);
            if (found) setSearchResult(found);
            else setSearchError('Contact not found.');
        }
    };

    // function to delete contact and handle server errors if necessary
    let deleteContact = async (id) => {
        setError(null);
        // delete from server
        try {
            let res = await axios.delete(`http://localhost:3002/contacts/${id}`);
            if (res && res.status >= 200 && res.status < 300) {
                fetchcontacts(true);
                return;
            }
        // fallback: remove locally
        } catch (err) {
            console.warn('DELETE to JSON Server failed, removing locally:', err.message);
            setcontacts(prev => prev.filter(c => c.id !== id));
            setError('JSON Server not reachable — contact removed locally only.');
        }
    };

    // derived sorted list
    let sortedContacts = useMemo(() => {
        if (sortOrder === 'none') return contacts;
        let copy = [...contacts];
        copy.sort((a, b) => {

            // handle missing or non-numeric ages
            // i noticed one of the contacts do not have an age, so we need to guard against that
            let aa = Number(a.age) || 'NA';
            let bb = Number(b.age) || 'NA';
            return sortOrder === 'asc' ? aa - bb : bb - aa;
        });
        return copy;
    }, [contacts, sortOrder]);

    // derived Indiana list (case-insensitive match on 'Indiana')
    let indianaContacts = useMemo(() => {
        return contacts.filter(c => {
            // guard against missing address 
            if (!c || !c.address) return false;
            // case-insensitive match on 'Indiana'
            return /\bIndiana\b/i.test(c.address);
        });
    }, [contacts]);

    //render this message if contacts are stil loadin gdue to runtime of server
    if (loading) return <div id="contactList">Loading contacts...</div>;

    return (
        <div id="contactList" className={styles.contactList}>
            <h2>Contacts</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>Total: {contacts.length}</p>

            {/* Search by ID UI */}
            <form onSubmit={searchById} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                <input
                    name="searchId"
                    placeholder="Search by ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ width: 120, marginRight: 8 }}
                />
                <button type="submit">Search</button>
                {searchError && <span style={{ color: 'red', marginLeft: 8 }}>{searchError}</span>}
            </form>

            {/* Search Result with a delete feature */}
            {searchResult && (
                <div style={{paddingLeft: '34%', marginBottom: 12, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}>
                    <h4>Found: {searchResult.name} (ID: {searchResult.id})</h4>
                    <p><strong>Age:</strong> {searchResult.age}</p>
                    <p><strong>Email:</strong> {searchResult.email}</p>
                    <p><strong>Phone:</strong> {searchResult.phone}</p>
                    <p><strong>Address:</strong> {searchResult.address}</p>
                    <button onClick={() => deleteContact(searchResult.id)} style={{ backgroundColor:'#c00', color:'#fff', border:'none', padding:'6px 10px', borderRadius:4, cursor:'pointer' }}>Delete</button>

                </div>
            )}

            {/* Indiana filter controls */}
            <div style={{ marginBottom: 12 }}>
                <button onClick={() => setShowIndiana(s => !s)} style={{ marginRight: 8 }}>{showIndiana ? 'Hide' : 'Show'} Indiana contacts ({indianaContacts.length})</button>
                {showIndiana && indianaContacts.length === 0 && <span style={{ color: '#666' }}> No contacts found for Indiana.</span>}
            </div>

            {/* Indiana contacts list */}
            {showIndiana && (
                <div className={styles.indiana} style={{ marginBottom: 16 }}>
                    <h3 style={{ marginTop: 0 }}>Indiana Contacts ({indianaContacts.length})</h3>
                    {indianaContacts.length > 0 ? (
                        <ul  style={{ listStyle: 'none', padding: 0 }}>
                            {indianaContacts.map(contact => (
                                <li key={contact.id} className={`${styles.contactItem} ${styles.indianaContactItem}`}>
                                    <h4>{contact.name} {typeof contact.age !== 'undefined' && <span style={{ fontWeight: 400 }}>({contact.age})</span>}</h4>
                                    <p><strong>Age:</strong> {contact.age}</p>
                                    <p><strong>Email:</strong> {contact.email}</p>
                                    <p><strong>Phone:</strong> {contact.phone}</p>
                                    <p><strong><b><i>Address:</i></b></strong> {contact.address}</p>
                                    <div>
                                        <button onClick={() => deleteContact(contact.id)} className={styles.delete}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#666' }}>No Indiana contacts to display.</p>
                    )}
                </div>
            )}

            {/* Sort controls */}
            <div style={{ marginBottom: 12 }}>
                <span style={{ marginRight: 8 }}>Sort by age:</span>
                <button onClick={() => setSortOrder('asc')} style={{ marginRight: 8 }}>Age ascending</button>
                <button onClick={() => setSortOrder('desc')} style={{ marginRight: 8 }}>Age descending</button>
                <button onClick={() => setSortOrder('none')}>reset</button>
            </div>

            {/* add a contacts to the server */}
            <form onSubmit={addContact} style={{ marginBottom: 16 }}>
                <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="address" placeholder="Address" value={form.address} onChange={handleChange} style={{ marginRight:8 }} />
                <input name="age" placeholder="Age" value={form.age} onChange={handleChange} style={{ width:80, marginRight:8 }} />
                <button type="submit">Add Contact</button>
            </form>

            {/* For each contacts be able to remove if necessary */}
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {sortedContacts.map(contact => (
                    <li key={contact.id} className={styles.contactItem}>
                        <h4>{contact.name} {typeof contact.age !== 'undefined' && <span style={{ fontWeight: 400 }}>({contact.age})</span>}</h4>
                        <p><strong>Age:</strong> {contact.age}</p>
                        <p><strong>Email:</strong> {contact.email}</p>
                        <p><strong>Phone:</strong> {contact.phone}</p>
                        <p><strong>Address:</strong> <b><i>{contact.address}</i></b></p>
                        <div>
                            <button onClick={() => deleteContact(contact.id)} className={styles.delete}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}