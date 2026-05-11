import { useState } from 'react';
import { cleanupMenuItems, deleteAllMenuItems } from './cleanupData';
import { populateMenuItems } from './populateData';

// Temporary component to help clean up duplicate menu items
// Add this to your App.jsx temporarily, then remove it after cleanup
const CleanupHelper = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCleanup = async () => {
    setLoading(true);
    setStatus('Cleaning up duplicates...');
    
    try {
      const deletedCount = await cleanupMenuItems();
      setStatus(`Cleanup completed! Deleted ${deletedCount} duplicate items.`);
    } catch (error) {
      setStatus(`Error during cleanup: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleResetAll = async () => {
    if (!window.confirm('This will delete ALL menu items and repopulate with fresh data. Are you sure?')) {
      return;
    }

    setLoading(true);
    setStatus('Deleting all items...');
    
    try {
      await deleteAllMenuItems();
      setStatus('Repopulating with fresh data...');
      await populateMenuItems();
      setStatus('Reset completed! Fresh menu items added.');
    } catch (error) {
      setStatus(`Error during reset: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      padding: '20px',
      border: '2px solid #ccc',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3>Menu Cleanup Helper</h3>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={handleCleanup}
          disabled={loading}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Working...' : 'Remove Duplicates'}
        </button>
        
        <button 
          onClick={handleResetAll}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Working...' : 'Reset All Data'}
        </button>
      </div>
      
      {status && (
        <div style={{
          padding: '8px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {status}
        </div>
      )}
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Remove this component after cleanup!
      </div>
    </div>
  );
};

export default CleanupHelper;