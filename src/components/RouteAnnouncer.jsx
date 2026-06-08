import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RouteAnnouncer = () => {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Basic route mapping for announcements
    const path = location.pathname;
    let message = '';

    if (path === '/') {
      message = 'Navigated to Course Catalog Dashboard';
    } else if (path === '/admin') {
      message = 'Navigated to Admin Control Panel';
    } else if (path === '/help') {
      message = 'Navigated to Help and Troubleshooting';
    } else {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 1) {
        message = `Navigated to Track: ${parts[0]}`;
      } else if (parts.length === 2) {
        message = `Navigated to Course: ${parts[1]} in Track: ${parts[0]}`;
      } else if (parts.length === 3) {
        message = `Navigated to Module: ${parts[2]} in Course: ${parts[1]}`;
      }
    }

    if (message) {
      setAnnouncement(message);
    }
  }, [location]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      }}
    >
      {announcement}
    </div>
  );
};

export default RouteAnnouncer;
