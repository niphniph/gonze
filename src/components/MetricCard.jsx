import React from 'react';
import { GlassCard } from './GlassCard';

export const MetricCard = ({ title, value, icon: Icon, footerText, className = '' }) => {
  return (
    <GlassCard className={`metric-card ${className}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && <Icon className="metric-icon" size={20} />}
      </div>
      <div className="metric-value">{value}</div>
      {footerText && <div className="metric-footer">{footerText}</div>}
    </GlassCard>
  );
};
