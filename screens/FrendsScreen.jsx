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

export default FriendsScreen;