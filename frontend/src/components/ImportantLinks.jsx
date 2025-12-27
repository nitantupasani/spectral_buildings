import React, { useState, useEffect } from 'react';
import { notesAPI } from '../api';

const ImportantLinks = ({ channel }) => {
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resetStateForChannel = () => {
      setShowForm(false);
      setForm({ title: '', url: '' });
      setError('');
      setLoading(true);
    };

    const fetchLinks = async () => {
      try {
        const { data } = await notesAPI.getLinksByChannel(channel);
        if (isMounted) {
          setLinks(data);
        }
      } catch (err) {
        if (isMounted) {
          setLinks([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    resetStateForChannel();
    fetchLinks();

    return () => {
      isMounted = false;
    };
  }, [channel]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await notesAPI.addLink({ ...form, channel });
      setLinks((prev) => [data, ...prev]);
      setForm({ title: '', url: '' });
      setShowForm(false);
    } catch (err) {
      setError('Failed to add link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="important-links-block">
      <div className="important-links-header">
        <span>Important Links</span>
        <button className="btn-link-add" onClick={() => setShowForm((v) => !v)} title="Add Link">+</button>
      </div>
      {showForm && (
        <form className="important-links-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            maxLength={40}
          />
          <input
            type="url"
            placeholder="https://example.com"
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
            required
          />
          <button type="submit" disabled={saving} className="btn btn-primary btn-compact">Save</button>
          {error && <div className="error">{error}</div>}
        </form>
      )}
      <ul className="important-links-list">
        {loading ? (
          <li className="important-link-item muted">Loading links...</li>
        ) : (
          <>
            {links.map((link, i) => (
              <li key={i} className="important-link-item">
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a>
                {link.user && (
                  <span className="important-link-user">by {link.user.username}</span>
                )}
              </li>
            ))}
            {links.length === 0 && <li className="important-link-item muted">No links yet</li>}
          </>
        )}
      </ul>
    </div>
  );
};

export default ImportantLinks;
