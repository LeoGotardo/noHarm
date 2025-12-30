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

export default ChatScreen;