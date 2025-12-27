import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildingsAPI } from '../api';
import { AuthContext } from '../AuthContext';
import AddBuildingModal from './AddBuildingModal';
import LoadingScreen from './LoadingScreen';

const BuildingList = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [viewMode, setViewMode] = useState('card');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingAdded = (newBuilding) => {
    setBuildings([newBuilding, ...buildings]);
    setShowModal(false);
  };

  const getStatusLabel = (status = '') => status?.trim() || 'Unknown';
  const statusThemes = {
    active: { bg: 'rgba(54, 201, 130, 0.18)', border: 'rgba(54, 201, 130, 0.5)', text: '#18a46c' },
    onboarding: { bg: 'rgba(92, 130, 255, 0.16)', border: 'rgba(92, 130, 255, 0.5)', text: '#4b61e8' },
    control: { bg: 'rgba(255, 196, 86, 0.18)', border: 'rgba(255, 196, 86, 0.55)', text: '#c57a00' },
    'bms data only': { bg: 'rgba(0, 209, 255, 0.16)', border: 'rgba(0, 209, 255, 0.45)', text: '#0086a3' },
    'on-hold': { bg: 'rgba(255, 124, 124, 0.16)', border: 'rgba(255, 124, 124, 0.5)', text: '#c94b4b' },
    'on hold': { bg: 'rgba(255, 124, 124, 0.16)', border: 'rgba(255, 124, 124, 0.5)', text: '#c94b4b' },
    renovations: { bg: 'rgba(255, 196, 86, 0.16)', border: 'rgba(255, 196, 86, 0.5)', text: '#a86a00' }
  };

  const getStatusTheme = (status) => {
    const normalized = getStatusLabel(status).toLowerCase();
    return statusThemes[normalized] || { bg: 'rgba(76, 142, 255, 0.12)', border: 'rgba(76, 142, 255, 0.35)', text: 'var(--text)' };
  };

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return '—';
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime())
      ? '—'
      : parsed.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set(buildings.map((building) => getStatusLabel(building.status)));
    return Array.from(uniqueStatuses).sort((a, b) => a.localeCompare(b));
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return buildings
      .filter((building) => {
        if (!query) return true;
        const searchableText = `${building.name || ''} ${building.address || ''}`.toLowerCase();
        return searchableText.includes(query);
      })
      .filter((building) => {
        if (statusFilter === 'all') return true;
        return getStatusLabel(building.status) === statusFilter;
      })
      .sort((a, b) => {
        if (sortOption === 'date-newest') {
          return new Date(b.onboardedDate) - new Date(a.onboardedDate);
        }
        if (sortOption === 'date-oldest') {
          return new Date(a.onboardedDate) - new Date(b.onboardedDate);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [buildings, searchTerm, statusFilter, sortOption]);

  if (loading) {
    return <LoadingScreen message="Mapping your buildings" />;
  }

  return (
    <div>
      <div className="building-toolbar">
        <h2>Buildings</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="segmented">
            <button
              type="button"
              className={viewMode === 'card' ? 'segmented__btn active' : 'segmented__btn'}
              onClick={() => setViewMode('card')}
            >
              Cards
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'segmented__btn active' : 'segmented__btn'}
              onClick={() => setViewMode('table')}
            >
              List
            </button>
          </div>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add Building
            </button>
          )}
        </div>
      </div>

      <div className="building-filters">
        <input
          type="search"
          className="form-control"
          placeholder="Search by name or address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="date-newest">Onboarded (Newest)</option>
          <option value="date-oldest">Onboarded (Oldest)</option>
        </select>
      </div>

      {buildings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No buildings found. {user?.role === 'admin' ? 'Add your first building!' : ''}</p>
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No buildings match your search or filters.</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="card building-table">
              <div className="building-table__header">
                <div>Name</div>
                <div>Address</div>
                <div>Client</div>
                <div>Status</div>
                <div>Updated</div>
              </div>
              <div className="building-table__body">
                {filteredBuildings.map((building) => (
                  <Link
                    key={building._id}
                    to={`/building/${building._id}`}
                    className="building-table__row"
                  >
                    <div className="building-table__cell">
                      <span className="building-name">{building.name || 'Untitled'}</span>
                    </div>
                    <div className="building-table__cell">
                      <div className="building-address">{building.address}</div>
                    </div>
                    <div className="building-table__cell">
                      {building.client ? building.client : <span className="muted">—</span>}
                    </div>
                    <div className="building-table__cell">
                      <span className={`status-pill status-${building.status || 'unknown'}`}>
                        {getStatusLabel(building.status)}
                      </span>
                    </div>
                    <div className="building-table__cell">
                      <div className="building-updated">
                        {building.updatedAt
                          ? new Date(building.updatedAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : new Date(building.onboardedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid building-grid">
              {filteredBuildings.map((building) => {
                const statusLabel = getStatusLabel(building.status);
                const statusTheme = getStatusTheme(building.status);
                const updatedDate = formatDisplayDate(building.updatedAt || building.onboardedDate);

                return (
                  <Link
                    key={building._id}
                    to={`/building/${building._id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card building-card">
                      <div className="building-card__top">
                        <div>
                          <p className="building-card__eyebrow">Building</p>
                          <h3 className="building-card__title">{building.name || building.address || 'Untitled'}</h3>
                        </div>
                        <span
                          className="status-chip"
                          style={{
                            backgroundColor: statusTheme.bg,
                            borderColor: statusTheme.border,
                            color: statusTheme.text
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <p className="building-card__address">📍 {building.address || 'Address pending'}</p>

                      {building.client && (
                        <p className="building-card__meta">Client: {building.client}</p>
                      )}

                      {building.description && (
                        <p className="building-card__description">{building.description}</p>
                      )}

                      <div className="building-card__footer">
                        <span className="building-card__tag">Updated {updatedDate}</span>
                        <span className="building-card__tag building-card__tag--muted">
                          Onboarded {formatDisplayDate(building.onboardedDate)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <AddBuildingModal
          onClose={() => setShowModal(false)}
          onBuildingAdded={handleBuildingAdded}
        />
      )}
    </div>
  );
};

export default BuildingList;
