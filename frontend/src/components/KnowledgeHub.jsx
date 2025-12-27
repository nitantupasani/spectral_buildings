import React, { useMemo, useState } from 'react';
import ChannelFeed from './ChannelFeed';
import BuildingList from './BuildingList';
import AddNoteModal from './AddNoteModal';
import VoiceRecorder from './VoiceRecorder';

const KnowledgeHub = () => {
  const tabs = useMemo(() => ([
    {
      key: 'general',
      label: 'General Announcements',
      title: 'General Announcements',
      accent: '#8ef0b5'
    },
    {
      key: 'onboarding',
      label: 'Mapping & Onboarding',
      title: 'Mapping & Onboarding',
      accent: '#7cd7ff'
    },
    {
      key: 'duty',
      label: 'Duty Log',
      title: 'Duty Log',
      accent: '#ffd580'
    },
    {
      key: 'buildings',
      label: 'Buildings',
      title: 'Buildings',
      accent: '#d9b3ff'
    }
  ]), []);

  const [activeTab, setActiveTab] = useState('general');
  const [showGeneralPostModal, setShowGeneralPostModal] = useState(false);
  const [showGeneralVoiceModal, setShowGeneralVoiceModal] = useState(false);
  const [generalRefreshKey, setGeneralRefreshKey] = useState(0);
  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const openGeneralPosts = () => {
    setActiveTab('general');
    setShowGeneralPostModal(true);
  };

  const openGeneralVoice = () => {
    setActiveTab('general');
    setShowGeneralVoiceModal(true);
  };

  const handleGeneralNoteAdded = () => {
    setGeneralRefreshKey((prev) => prev + 1);
    setShowGeneralPostModal(false);
  };

  const handleGeneralVoiceAdded = () => {
    setGeneralRefreshKey((prev) => prev + 1);
    setShowGeneralVoiceModal(false);
  };

  return (
    <div className="knowledge-layout">
      <div className="hero-card">
        <div>
          <div className="eyebrow">BRIGHTER CONTROL TEAM</div>
          <h1 className="hero-title">Knowledge Sharing Platform</h1>
          <div className="hero-pills">
            <button type="button" className="pill pill-action" onClick={openGeneralVoice}>
              🎤 Quick voice note
            </button>
            <button type="button" className="pill pill-action" onClick={openGeneralPosts}>
              📝 New post for General
            </button>
          </div>
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
          <BuildingList />
        </div>
      ) : (
        <ChannelFeed
          channel={currentTab.key}
          title={currentTab.title}
          accent={currentTab.accent}
          refreshKey={currentTab.key === 'general' ? generalRefreshKey : 0}
        />
      )}

      {showGeneralPostModal && (
        <AddNoteModal
          channel="general"
          onClose={() => setShowGeneralPostModal(false)}
          onNoteAdded={handleGeneralNoteAdded}
        />
      )}

      {showGeneralVoiceModal && (
        <VoiceRecorder
          channel="general"
          onClose={() => setShowGeneralVoiceModal(false)}
          onVoiceNoteAdded={handleGeneralVoiceAdded}
        />
      )}
    </div>
  );
};

export default KnowledgeHub;
