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

export default Header;