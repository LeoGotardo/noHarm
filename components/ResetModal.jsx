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

export default ResetModal;