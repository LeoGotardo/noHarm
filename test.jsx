import React, { useState, useEffect } from 'react';

// ============ ATOM COMPONENTS ============

const Avatar = ({ children, gradient = "linear-gradient(135deg, #3b82f6, #2563eb)", size = 60 }) => (
  <div 
    className="rounded-full flex items-center justify-center text-white relative"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      background: gradient,
      fontSize: `${size * 0.4}px`
    }}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = "primary" }) => {
  const variants = {
    primary: "bg-blue-500",
    danger: "bg-red-600",
    success: "bg-green-500"
  };
  
  return (
    <span className={`${variants[variant]} text-white rounded-xl px-2 py-0.5 text-xs font-bold`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = "primary", onClick, disabled, className = "" }) => {
  const variants = {
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-blue-500/40",
    danger: "bg-gradient-to-br from-red-600 to-red-700 hover:shadow-red-600/40",
    success: "bg-gradient-to-br from-green-500 to-green-600 hover:shadow-green-500/40",
    secondary: "bg-slate-700 hover:shadow-slate-700/40"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-4 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${variants[variant]} hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-700 rounded-2xl p-5 border border-slate-600 ${className}`}>
    {children}
  </div>
);

const Header = ({ onMenuClick }) => (
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 flex justify-between items-center shadow-lg shadow-blue-500/30">
    <div className="text-2xl font-bold text-white flex items-center gap-2">
      <i className="bi bi-heart-pulse-fill text-3xl"></i> NoHarm
    </div>
    <button 
      onClick={onMenuClick}
      className="bg-white/20 border-0 px-4 py-2 rounded-lg cursor-pointer text-white text-2xl transition-all duration-300 hover:bg-white/30 hover:scale-105"
    >
      <i className="bi bi-list"></i>
    </button>
  </div>
);

const IconButton = ({ icon, onClick, variant = "primary" }) => {
  const variants = {
    primary: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30"
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg border-0 cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 ${variants[variant]}`}
    >
      <i className={icon}></i>
    </button>
  );
};

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-3xl max-w-sm w-11/12 text-center border border-slate-700">
        {children}
      </div>
    </div>
  );
};

// ============ COMPONENT PIECES ============

const ActionCard = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-slate-700 p-5 rounded-2xl mb-4 border border-slate-600 cursor-pointer transition-all duration-300 hover:bg-slate-600 hover:translate-x-1"
  >
    <div className="flex items-center gap-4 mb-2">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/20">
        <i className={`${icon} text-blue-400 text-3xl`}></i>
      </div>
      <div className="text-base font-semibold text-slate-100">{title}</div>
    </div>
    <div className="text-sm text-slate-400 ml-16">{description}</div>
  </div>
);

const ButtonNavigation = ({ active, onClick, icon, label, badge }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 flex-1 ${active ? 'text-blue-500 -translate-y-1' : 'text-slate-500'} hover:text-blue-500 hover:-translate-y-1`}
  >
    <div className="relative">
      <div className="text-2xl">
        <i className={icon}></i>
      </div>
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-lg px-1.5 py-0.5 text-xs font-bold">
          {badge}
        </div>
      )}
    </div>
    <div className="text-xs">{label}</div>
  </div>
);

const CounterCard = ({ days, onReset, onSupport }) => {
  const monthsAndDays = Math.floor(days / 30);
  const remainingDays = days % 30;
  const progressToSixMonths = (days / 180) * 100;
  const daysToSixMonths = 180 - days;
  
  return (
    <Card className="bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl">
      <div className="text-center text-5xl mb-5 animate-pulse">
        <i className="bi bi-star-fill text-yellow-400"></i>
      </div>
      <div className="text-center text-6xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
        {days}
      </div>
      <div className="text-center text-2xl text-slate-400 mb-5">dias limpos</div>
      <div className="text-center text-base text-green-500 font-semibold mb-5 p-2 bg-green-500/10 rounded-lg">
        <i className="bi bi-trophy-fill"></i> Parabéns! {monthsAndDays} meses{remainingDays > 0 && ` e ${remainingDays} dias`}!
      </div>
      
      <div className="my-5">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Próximo marco: 6 meses</span>
          <span>{daysToSixMonths} dias</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000 relative overflow-hidden"
            style={{ width: `${Math.min(progressToSixMonths, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-5">
        <Button variant="danger" onClick={onReset}>
          <i className="bi bi-arrow-clockwise"></i> Reset
        </Button>
        <Button variant="primary" onClick={onSupport}>
          <i className="bi bi-heart-fill"></i> Apoio
        </Button>
      </div>
    </Card>
  );
};

const EmergencyButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="bg-gradient-to-br from-red-600 to-red-800 text-white p-5 rounded-2xl border-0 w-full text-lg font-bold cursor-pointer mt-5 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 animate-[pulse-red_2s_infinite]"
  >
    <i className="bi bi-telephone-fill"></i> Preciso de Ajuda Agora
  </button>
);

const EmergencyCard = ({ icon, title, subtitle, buttonText, buttonVariant, buttonIcon, onClick }) => (
  <Card className="bg-gradient-to-br from-slate-700 to-slate-800 mb-5 border-2">
    <div className="flex items-center gap-4 mb-5">
      <div className={`w-15 h-15 rounded-2xl flex items-center justify-center text-3xl ${
        buttonVariant === 'danger' ? 'bg-red-600/20 text-red-400' :
        buttonVariant === 'primary' ? 'bg-blue-500/20 text-blue-400' :
        'bg-green-500/20 text-green-500'
      }`}>
        <i className={icon}></i>
      </div>
      <div>
        <div className="text-lg font-semibold text-slate-100 mb-1">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
    <Button variant={buttonVariant} onClick={onClick} className="w-full">
      <i className={buttonIcon}></i> {buttonText}
    </Button>
  </Card>
);

const MilestoneItem = ({ icon, name, date, achieved }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
      achieved ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-500'
    }`}>
      <i className={icon}></i>
    </div>
    <div className="flex-1">
      <div className="text-sm font-semibold text-slate-100">{name}</div>
      <div className="text-xs text-slate-500">{date}</div>
    </div>
  </div>
);

const ProgressBar = ({ value, max, label }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="my-5">
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const SearchBox = ({ placeholder, value, onChange }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base mb-5 focus:outline-none focus:border-blue-500"
  />
);

const SideMenu = ({ isOpen, onClose, onNavigate }) => (
  <>
    <div 
      className={`fixed top-0 left-0 w-full h-full bg-black/70 z-[999] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    ></div>
    <div 
      className={`fixed top-0 w-70 h-full bg-slate-950 shadow-xl z-[1000] p-5 transition-all duration-300 ${isOpen ? 'right-0' : '-right-70'}`}
    >
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
        <h3 className="text-xl font-bold">Menu</h3>
        <button onClick={onClose} className="bg-transparent border-0 text-white text-3xl cursor-pointer">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      
      {[
        { icon: 'bi-house-fill', label: 'Início', screen: 'home' },
        { icon: 'bi-people-fill', label: 'Amigos', screen: 'friends' },
        { icon: 'bi-chat-dots-fill', label: 'Conversas', screen: 'chat' },
        { icon: 'bi-bar-chart-fill', label: 'Progresso', screen: 'progress' },
        { icon: 'bi-exclamation-triangle-fill', label: 'Emergência', screen: 'emergency' },
        { icon: 'bi-gear-fill', label: 'Configurações', screen: 'settings' }
      ].map(item => (
        <div 
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className="p-4 my-2 bg-slate-800 rounded-lg cursor-pointer flex items-center gap-3 transition-all duration-300 hover:bg-slate-700 hover:-translate-x-1"
        >
          <i className={`bi ${item.icon} text-xl w-6 text-center`}></i> {item.label}
        </div>
      ))}
    </div>
  </>
);

const StatCard = ({ icon, label, value }) => (
  <Card className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
    <div className="text-4xl mb-2">
      <i className={`bi ${icon} text-blue-400`}></i>
    </div>
    <div className="text-xs text-slate-400 mb-1">{label}</div>
    <div className="text-2xl font-bold text-blue-400">{value}</div>
  </Card>
);

const StatsGrid = ({ children }) => (
  <div className="grid grid-cols-2 gap-4 mb-5">
    {children}
  </div>
);

// ============ RESET MODAL ============

const ResetModal = ({ isOpen, onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  
  const handleConfirm = () => {
    if (confirmText.toLowerCase() === 'confirmo') {
      onConfirm();
      setConfirmText('');
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-6xl mb-5">
        <i className="bi bi-exclamation-triangle-fill text-red-500"></i>
      </div>
      <h2 className="text-2xl mb-4 text-red-500">Resetar Contador?</h2>
      <p className="text-slate-400 mb-5 leading-relaxed">
        Entendemos que a recuperação tem altos e baixos. Um relapso não apaga todo o seu progresso. 
        Você é corajoso por continuar tentando.
      </p>
      <p className="text-slate-400 mb-5">
        Para confirmar, digite <strong className="text-white">"confirmo"</strong> abaixo:
      </p>
      <input
        type="text"
        placeholder="Digite 'confirmo'"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full p-4 border-2 border-slate-700 rounded-lg bg-slate-950 text-white text-base mb-5 text-center focus:outline-none focus:border-blue-500"
      />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={confirmText.toLowerCase() !== 'confirmo'}
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
};

// ============ SCREENS ============

const HomeScreen = ({ cleanDays, onResetClick, onEmergencyClick }) => (
  <div>
    <div className="text-center mb-8">
      <h2 className="text-xl text-slate-400 mb-1">Bem-vindo de volta,</h2>
      <h1 className="text-3xl text-blue-400 mb-2">Maria</h1>
    </div>
    
    <CounterCard days={cleanDays} onReset={onResetClick} onSupport={() => alert('Funcionalidade em desenvolvimento')} />
    
    <StatsGrid>
      <StatCard icon="bi-people-fill" label="Amigos Online" value="8" />
      <StatCard icon="bi-award-fill" label="Marcos Alcançados" value="12" />
    </StatsGrid>
    
    <div className="mt-8">
      <h3 className="text-lg text-slate-400 mb-4 flex items-center gap-2">
        <i className="bi bi-stars"></i> Ações Rápidas
      </h3>
      
      <ActionCard
        icon="bi bi-journal-text"
        title="Diário Emocional"
        description="Registre seus sentimentos e pensamentos"
        onClick={() => alert('Diário Emocional em desenvolvimento')}
      />
      
      <ActionCard
        icon="bi bi-cloud-sun"
        title="Meditação Guiada"
        description="Exercícios de respiração e relaxamento"
        onClick={() => alert('Meditação em desenvolvimento')}
      />
      
      <ActionCard
        icon="bi bi-chat-quote"
        title="Afirmações Positivas"
        description="Mensagens diárias de encorajamento"
        onClick={() => alert('Afirmações em desenvolvimento')}
      />
    </div>
    
    <EmergencyButton onClick={onEmergencyClick} />
  </div>
);

const FriendsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const friends = [
    { name: 'Ana Silva', days: 45, status: 'online', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { name: 'Carlos Mendes', days: 12, status: 'online', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
    { name: 'Julia Costa', days: 78, status: 'online', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { name: 'Pedro Santos', days: 23, status: 'offline', gradient: 'linear-gradient(135deg, #64748b, #475569)' }
  ];
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-blue-400">Meus Amigos</h1>
      </div>
      
      <SearchBox 
        placeholder="🔍 Buscar amigos..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg text-slate-400 flex items-center gap-2">
          <i className="bi bi-people-fill"></i> Online (8)
        </h3>
        <button className="bg-blue-500 text-white border-0 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1 transition-all duration-300 hover:bg-blue-600 hover:-translate-y-0.5">
          <i className="bi bi-person-plus-fill"></i> Adicionar
        </button>
      </div>
      
      {friends.map((friend, idx) => (
        <Card key={idx} className="mb-4 flex items-center gap-4 transition-all duration-300 hover:bg-slate-600 hover:translate-x-1">
          <div className="relative">
            <Avatar gradient={friend.gradient} size={60}>
              <i className="bi bi-person-fill"></i>
            </Avatar>
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-700 ${friend.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-slate-100 mb-1">{friend.name}</div>
            <div className="text-xs text-slate-400">{friend.days} dias limpo • {friend.status === 'online' ? 'Online agora' : 'Visto há 2h'}</div>
          </div>
          <div className="flex gap-2">
            <IconButton icon="bi bi-chat-fill" onClick={() => alert(`Chat com ${friend.name}`)} />
            <IconButton icon="bi bi-three-dots-vertical" onClick={() => alert('Mais opções')} />
          </div>
        </Card>
      ))}
    </div>
  );
};

const ChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const chats = [
    { name: 'Ana Silva', message: 'Como você está se sentindo hoje?', time: 'Agora', unread: 3, avatar: 'bi-person-fill', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
    { name: 'Julia Costa', message: 'Obrigada pelo apoio! 💙', time: '10:30', unread: 0, avatar: 'bi-person-fill', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { name: 'Suporte NoHarm 24h', message: 'Estamos sempre aqui para você!', time: 'Ontem', unread: 1, avatar: 'bi-headset', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' }
  ];
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-blue-400">Conversas</h1>
      </div>
      
      <SearchBox 
        placeholder="🔍 Buscar conversas..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="mb-20">
        {chats.map((chat, idx) => (
          <Card 
            key={idx}
            className={`mb-3 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:bg-slate-600 relative ${chat.unread > 0 ? 'border-l-4 border-l-blue-500' : ''}`}
          >
            <Avatar gradient={chat.gradient} size={55}>
              <i className={`bi ${chat.avatar}`}></i>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <div className="text-base font-semibold text-slate-100">{chat.name}</div>
                <div className="text-xs text-slate-500">{chat.time}</div>
              </div>
              <div className="text-sm text-slate-400 flex items-center gap-1">
                {chat.unread === 0 && <i className="bi bi-check2-all text-blue-400"></i>}
                <span>{chat.message}</span>
              </div>
            </div>
            {chat.unread > 0 && <Badge variant="primary">{chat.unread}</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
};

const EmergencyScreen = () => (
  <div>
    <div className="text-center mb-8">
      <h1 className="text-3xl text-blue-400 mb-2">Recursos de Emergência</h1>
      <p className="text-slate-400 text-sm">Você não está sozinho. Estamos aqui para ajudar.</p>
    </div>
    
    <EmergencyCard
      icon="bi bi-telephone-fill"
      title="CVV - Centro de Valorização da Vida"
      subtitle="Prevenção do suicídio - 24h gratuito"
      buttonText="Ligar 188"
      buttonVariant="danger"
      buttonIcon="bi bi-telephone-fill"
      onClick={() => window.location.href = 'tel:188'}
    />
    
    <EmergencyCard
      icon="bi bi-hospital"
      title="CAPS - Centro de Atenção Psicossocial"
      subtitle="Atendimento especializado em saúde mental"
      buttonText="Encontrar CAPS Próximo"
      buttonVariant="primary"
      buttonIcon="bi bi-geo-alt-fill"
      onClick={() => alert('Buscando CAPS próximos...')}
    />
    
    <EmergencyCard
      icon="bi bi-heart-pulse"
      title="Técnicas de Emergência"
      subtitle="Exercícios para momentos difíceis"
      buttonText="Ver Técnicas"
      buttonVariant="success"
      buttonIcon="bi bi-play-circle-fill"
      onClick={() => alert('Carregando técnicas...')}
    />
    
    <EmergencyCard
      icon="bi bi-heart-fill"
      title="SAMU"
      subtitle="Emergências médicas"
      buttonText="Ligar 192"
      buttonVariant="danger"
      buttonIcon="bi bi-telephone-fill"
      onClick={() => window.location.href = 'tel:192'}
    />
  </div>
);

const ProgressScreen = ({ cleanDays }) => {
  const milestones = [
    { name: '1 Ano Limpo', date: 'Não alcançado', achieved: false, icon: 'bi bi-lock-fill' },
    { name: '6 Meses Limpo', date: 'Não alcançado', achieved: false, icon: 'bi bi-lock-fill' },
    { name: '3 Meses Limpo', date: 'Alcançado em 15/10/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Mês Limpo', date: 'Alcançado em 15/08/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Semana Limpa', date: 'Alcançado em 22/07/2024', achieved: true, icon: 'bi bi-check2' },
    { name: '1 Dia Limpo', date: 'Alcançado em 16/07/2024', achieved: true, icon: 'bi bi-check2' }
  ];
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl text-blue-400">Seu Progresso</h1>
      </div>
      
      <Card className="mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-slate-100">Tempo Limpo Total</div>
          <div className="text-4xl font-bold text-blue-400">{cleanDays} dias</div>
        </div>
        <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg flex items-center justify-center text-slate-500">
          <i className="bi bi-graph-up text-5xl"></i>
        </div>
      </Card>
      
      <StatsGrid>
        <StatCard icon="bi-trophy-fill" label="Melhor Sequência" value={`${cleanDays}d`} />
        <StatCard icon="bi-calendar-check" label="Tempo Médio" value="98d" />
      </StatsGrid>
      
      <Card>
        <h3 className="text-base font-semibold text-slate-100 mb-4">
          <i className="bi bi-award-fill"></i> Marcos Alcançados
        </h3>
        <div className="flex flex-col gap-2">
          {milestones.map((milestone, idx) => (
            <MilestoneItem
              key={idx}
              icon={milestone.icon}
              name={milestone.name}
              date={milestone.date}
              achieved={milestone.achieved}
            />
          ))}
        </div>
      </Card>
      
      <div className="h-24"></div>
    </div>
  );
};

// ============ MAIN APP ============

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
    </div
  );
}