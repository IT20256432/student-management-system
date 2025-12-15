// DebugToken.jsx
import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/authAPI';

const DebugToken = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const gatherDebugInfo = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const isAuth = localStorage.getItem('isAuthenticated');
      
      setDebugInfo({
        tokenExists: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 30)}...` : 'None',
        user: user ? JSON.parse(user) : null,
        isAuthenticated: isAuth,
        localStorageKeys: Object.keys(localStorage)
      });
    };
    
    gatherDebugInfo();
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Test API response:', response.status, response.statusText);
      alert(`API Test: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Test API error:', error);
      alert(`API Test Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔧 Token Debug Info</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>LocalStorage Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      
      <button onClick={testApiCall} style={{ padding: '10px 20px', margin: '10px' }}>
        Test API Call
      </button>
      
      <button onClick={() => {
        localStorage.clear();
        window.location.reload();
      }} style={{ padding: '10px 20px', margin: '10px', backgroundColor: '#ffcccc' }}>
        Clear localStorage
      </button>
      
      <button onClick={() => {
        console.log('Current token:', localStorage.getItem('token'));
        console.log('Current user:', localStorage.getItem('user'));
      }} style={{ padding: '10px 20px', margin: '10px' }}>
        Log to Console
      </button>
    </div>
  );
};

export default DebugToken;