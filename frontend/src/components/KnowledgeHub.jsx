import React, { useMemo, useState } from 'react';
import ChannelFeed from './ChannelFeed';
import BuildingList from './BuildingList';

const KnowledgeHub = () => {
  const tabs = useMemo(() => ([
    {
      key: 'general',
      label: 'General Announcements',
      title: 'General Announcements',
      description: 'Share quick updates, alerts, and wins across the Brighter Control Team.',
      accent: '#8ef0b5'
    },
    {
      key: 'onboarding',
      label: 'Mapping & Onboarding',
      title: 'Mapping & Onboarding',
      description: 'Capture SOPs, onboarding notes, and site mapping status for new clients.',
      accent: '#7cd7ff'
    },
    {
      key: 'duty',
      label: 'Duty Log',
      title: 'Duty Log',
      description: 'Record daily duty shifts, escalations, and handover notes.',
      accent: '#ffd580'
    },
    {
      key: 'buildings',
      label: 'Buildings',
      title: 'Buildings',
      description: 'Dive into building-specific intelligence, status, and voice notes.',
      accent: '#d9b3ff'
    }
  ]), []);

  const [activeTab, setActiveTab] = useState('general');
  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="knowledge-layout">
      <div className="hero-card">
        <div>
          <div className="eyebrow">BRIGHTER CONTROL TEAM</div>
          <h1 className="hero-title">Knowledge Sharing Platform</h1>
          <p className="hero-subtitle">
            A single place for the Brighter Control Team to announce, onboard, coordinate duty shifts,
            and capture building intelligence with voice notes and attachments.
          </p>
          <div className="hero-pills">
            <span className="pill">🎤 Voice notes</span>
            <span className="pill">📝 Rich posts</span>
            <span className="pill">📎 File & media attachments</span>
          </div>
        </div>
        <div className="hero-stat">
          <div className="stat-value">4</div>
          <div className="stat-label">Knowledge Streams</div>
          <p className="stat-desc">General, Mapping & Onboarding, Duty Log, and Building intel.</p>
        </div>
      </div>

      <div className="tab-strip">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'buildings' ? (
        <div className="card">
          <div className="eyebrow" style={{ color: currentTab.accent }}>{currentTab.title}</div>
          <h3 style={{ marginBottom: '6px' }}>Building Intelligence</h3>
          <p className="channel-description">
            The building list and detail pages stay available for deep dives—voice notes and attachments included.
          </p>
          <BuildingList />
        </div>
      ) : (
        <ChannelFeed
          channel={currentTab.key}
          title={currentTab.title}
          description={currentTab.description}
          accent={currentTab.accent}
        />
      )}
    </div>
  );
};

export default KnowledgeHub;
