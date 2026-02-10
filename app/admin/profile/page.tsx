'use client';

import { useState, useEffect } from 'react';
import { AdminProfile } from '@/components/admin/admin-profile';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return <AdminProfile currentUser={currentUser} />;
}
