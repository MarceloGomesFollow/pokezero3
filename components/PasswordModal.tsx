import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  onClose: () => void;
  onSubmit: (password: string) => void;
  error: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input field when the modal appears
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fadeInUp" 
        style={{animationDuration: '0.3s'}}
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-yellow-400/50 relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-yellow-300">Acesso Restrito</h2>
        <p className="text-center text-gray-300 mb-6">Digite a senha de administrador para continuar.</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/20 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {error && <p className="text-red-500 text-sm text-center mt-2 animate-shake">{error}</p>}
          <div className="flex justify-center gap-4 mt-6">
             <button type="button" onClick={onClose} className="py-2 px-6 rounded-md font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 transition-colors">
                Cancelar
             </button>
             <button type="submit" className="py-2 px-6 rounded-md font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 transition-colors">
                Entrar
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
