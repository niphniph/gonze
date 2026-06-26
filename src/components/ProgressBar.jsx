

export const ProgressBar = ({ progress, className = '', showPercent = true }) => {
  const pct = Math.min(100, Math.max(0, Math.round(progress || 0)));
  const isComplete = pct === 100;

  return (
    <div className={`progress-bar-wrapper ${className}`}>
      <div className="progress-bar-header">
        <span className="progress-bar-label">პროგრესი</span>
        {showPercent && (
          <span className={`progress-bar-val ${isComplete ? 'complete' : 'ongoing'}`}>
            {pct}%
          </span>
        )}
      </div>
      <div className="progress-bar-track">
        <div 
          className={`progress-bar-fill ${isComplete ? 'complete' : 'ongoing'}`}
          style={{ '--progress-pct': `${pct}%` }}
        />
      </div>
    </div>
  );
};
