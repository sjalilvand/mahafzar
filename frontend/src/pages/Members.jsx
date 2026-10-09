import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Github, Mail } from 'lucide-react';
import axios from 'axios';
import './Members.css';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const Members = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/members/`);
      setMembers(res.data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  return (
    <div className="members-page">
      <section className="members-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>اعضای تیم ماه‌افزار</h1>
          <p>متخصصان متعهد و خلاق که رویاهای دیجیتال را به واقعیت تبدیل می‌کنند</p>
        </motion.div>
      </section>

      <section className="members-grid-section">
        <div className="members-grid">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              className="member-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div className="member-avatar">
                <img loading="lazy" decoding="async"
                  src={member.avatar_url || '/default-avatar.png'}
                  alt={member.name}
                />
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <span className="member-position">{member.position}</span>
                <span className="member-department">{member.department}</span>
                <p className="member-bio">{member.bio}</p>

                {member.skills && (
                  <div className="member-skills">
                    {member.skills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}

                <div className="member-social">
                  {member.linkedin_url && (
                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {member.github_url && (
                    <a href={member.github_url} target="_blank" rel="noopener noreferrer">
                      <Github size={20} />
                    </a>
                  )}
                  <a href={`mailto:info@mah-afzar.ir`}>
                    <Mail size={20} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Members;


