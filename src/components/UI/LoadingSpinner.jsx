import './LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'md' }) => {
  return (
    <div className="loading-container">
      <div className={`spinner spinner-${size}`}></div>
    </div>
  );
};

export default LoadingSpinner;