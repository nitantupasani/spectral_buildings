import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildingsAPI } from '../api';
import { AuthContext } from '../AuthContext';
import AddBuildingModal from './AddBuildingModal';

const BuildingList = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
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
    return <div className="loading">Loading buildings...</div>;
  }

  return (
    <div>
      <div className="building-toolbar">
        <h2>Buildings</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Building
          </button>
        )}
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
        <div className="grid">
          {filteredBuildings.map((building) => (
            <Link
              key={building._id}
              to={`/building/${building._id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <h3 style={{ fontWeight: '700', fontSize: '16px' }}>
                  📍 {building.address}
                </h3>
                <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--dark)' }}>
                  {building.name}
                </p>
                {building.client && (
                  <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--secondary-color)', fontWeight: 500 }}>
                    Client: {building.client}
                  </p>
                )}
                {building.description && (
                  <p style={{ marginTop: '12px', fontSize: '14px' }}>
                    {building.description}
                  </p>
                )}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: building.status === 'active' ? '#d1fae5' : '#fee2e2',
                      color: building.status === 'active' ? '#065f46' : '#991b1b'
                    }}
                  >
                    {building.status}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--secondary-color)' }}>
                    {new Date(building.onboardedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
