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

export default Modal;