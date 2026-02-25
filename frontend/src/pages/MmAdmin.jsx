import { useEffect } from 'react';

function MmAdmin() {
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';
    const adminUrl = apiUrl.replace('/api', '/admin');
    window.location.href = adminUrl;
  }, []);

  return (
    <div className="section-container pt-32 text-center">
      <p className="text-heading text-lg">Redirection vers mm-admin...</p>
    </div>
  );
}

export default MmAdmin;
