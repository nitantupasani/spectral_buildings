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
            <div className="grid">
              {filteredBuildings.map((building) => (
                <Link
                  key={building._id}
                  to={`/building/${building._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="card building-card"
                  >
                    <h3 style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '0.01em', marginBottom: 2 }}>
                      📍 {building.address}
                    </h3>
                    <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                      {building.name}
                    </p>
                    {building.client && (
                      <p style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
                        Client: {building.client}
                      </p>
                    )}
                    {building.description && (
                      <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                        {building.description}
                      </p>
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          backgroundColor: building.status === 'active' ? 'rgba(28, 198, 118, 0.16)' : 'rgba(255, 95, 82, 0.16)',
                          color: building.status === 'active' ? '#9fffc6' : '#ffc6c0',
                          border: `1px solid ${building.status === 'active' ? 'var(--primary)' : '#ff5f52'}`
                        }}
                      >
                        {building.status}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {new Date(building.onboardedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
