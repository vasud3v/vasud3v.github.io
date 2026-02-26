import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="transition-forum fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-forum-pink to-forum-pink/90 text-white shadow-[0_0_30px_rgba(255,45,146,0.4)] animate-pulse-pink hover:scale-[1.04] hover:shadow-[0_0_40px_rgba(255,45,146,0.6)] active:scale-95 border border-forum-pink/60"
    >
      <Plus size={24} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
    </button>
  );
}
