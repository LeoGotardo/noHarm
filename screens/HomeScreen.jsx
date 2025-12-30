export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [cleanDays, setCleanDays] = useState(142);
  
  const handleNavigation = (screen) => {
    setCurrentScreen(screen);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  
  const handleReset = () => {
    setCleanDays(0);
    setResetModalOpen(false);
    alert('💙 Lembre-se: cada dia é uma nova oportunidade. Você é mais forte do que imagina.');
  };
  
  const screens = {
    home: <HomeScreen cleanDays={cleanDays} onResetClick={() => setResetModalOpen(true)} onEmergencyClick={() => handleNavigation('emergency')} />,
    friends: <FriendsScreen />,
    chat: <ChatScreen />,
    emergency: <EmergencyScreen />,
    progress: <ProgressScreen cleanDays={cleanDays} />
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-950 text-slate-100">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-red {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3); }
          50% { transform: scale(1.02); box-shadow: 0 15px 40px rgba(220, 38, 38, 0.5); }
        }
      `}</style>
      
      <div className="max-w-md mx-auto bg-slate-800 min-h-screen relative shadow-2xl">
        <Header onMenuClick={() => setMenuOpen(true)} />
        
        <SideMenu 
          isOpen={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          onNavigate={handleNavigation}
        />
        
        <div className="p-5 pb-24">
          {screens[currentScreen] || screens.home}
        </div>
        
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950 flex justify-around p-4 border-t border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <ButtonNavigation 
            active={currentScreen === 'home'}
            onClick={() => handleNavigation('home')}
            icon="bi bi-house-fill"
            label="Início"
          />
          <ButtonNavigation 
            active={currentScreen === 'friends'}
            onClick={() => handleNavigation('friends')}
            icon="bi bi-people-fill"
            label="Amigos"
          />
          <ButtonNavigation 
            active={currentScreen === 'chat'}
            onClick={() => handleNavigation('chat')}
            icon="bi bi-chat-dots-fill"
            label="Chat"
            badge={3}
          />
          <ButtonNavigation 
            active={currentScreen === 'progress'}
            onClick={() => handleNavigation('progress')}
            icon="bi bi-graph-up"
            label="Progresso"
          />
          <ButtonNavigation 
            active={currentScreen === 'emergency'}
            onClick={() => handleNavigation('emergency')}
            icon="bi bi-shield-fill-exclamation"
            label="SOS"
          />
        </div>
        
        <ResetModal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onConfirm={handleReset}
        />
      </div>
    </div>
  );
}