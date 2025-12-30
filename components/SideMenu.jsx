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

export default SideMenu;