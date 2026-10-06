import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Save } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL||'http://127.0.0.1:5000')+'/api';

const MissionManagement = () => {
  const { token } = useAuth();
  const [missions, setMissions] = useState([]);

  useEffect(() => { fetchMissions(); }, []);

  const fetchMissions = async () => {
    const res = await axios.get(`${API_URL}/admin/missions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMissions(res.data);
  };

  const handleSave = async (mission) => {
    await axios.put(`${API_URL}/admin/missions`, mission, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('ذخیره شد!');
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>ویرایش ماموریت‌ها و چشم‌انداز</h2>
      </div>
      <div className="missions-grid">
        {missions.map(mission => (
          <div key={mission.id} className="mission-edit-card glass-card">
            <div className="form-group">
              <label>عنوان</label>
              <input value={mission.title}
                onChange={(e) => {
                  const updated = missions.map(m =>
                    m.id === mission.id ? {...m, title: e.target.value} : m
                  );
                  setMissions(updated);
                }} />
            </div>
            <div className="form-group">
              <label>آیکون</label>
              <input value={mission.icon}
                onChange={(e) => {
                  const updated = missions.map(m =>
                    m.id === mission.id ? {...m, icon: e.target.value} : m
                  );
                  setMissions(updated);
                }} />
            </div>
            <div className="form-group">
              <label>محتوا</label>
              <textarea value={mission.content} rows={4}
                onChange={(e) => {
                  const updated = missions.map(m =>
                    m.id === mission.id ? {...m, content: e.target.value} : m
                  );
                  setMissions(updated);
                }} />
            </div>
            <button onClick={() => handleSave(mission)} className="btn-save">
              <Save size={16} /> ذخیره تغییرات
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionManagement;
