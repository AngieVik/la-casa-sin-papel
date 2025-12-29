import React, { useEffect } from 'react';
import MainLayout from './components/MainLayout';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import PatioView from './components/PatioView';
import UIPlayer from './components/UIPlayer';
import UIGameMaster from './components/UIGameMaster';
import { useStore } from './store';

const App: React.FC = () => {
  const currentView = useStore((state) => state.ui.currentView);
  const subscribeToRoom = useStore((state) => state.subscribeToRoom);

  // Initialize Realtime DB Listeners once
  useEffect(() => {
    subscribeToRoom();
  }, [subscribeToRoom]);

  return (
    <MainLayout>
      {currentView === 'login' && <LoginView />}
      {currentView === 'patio' && <PatioView />}
      {currentView === 'gm' && <UIGameMaster />}
      {currentView === 'player' && <UIPlayer />}
    </MainLayout>
  );
};

export default App;