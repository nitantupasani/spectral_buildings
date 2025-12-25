import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { buildingsAPI } from '../api';
import { AuthContext } from '../AuthContext';
import AddBuildingModal from './AddBuildingModal';

const BuildingList = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  if (loading) {
    return <div className="loading">Loading buildings...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Buildings</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Building
          </button>
        )}
      </div>

      {buildings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No buildings found. {user?.role === 'admin' ? 'Add your first building!' : ''}</p>
        </div>
      ) : (
        <div className="grid">
          {buildings.map((building) => (
            <Link
              key={building._id}
              to={`/building/${building._id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <h3>{building.name}</h3>
                <p style={{ color: 'var(--secondary-color)', marginTop: '8px' }}>
                  📍 {building.address}
                </p>
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
