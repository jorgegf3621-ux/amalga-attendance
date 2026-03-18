import { useTheme } from '../lib/theme';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      style={{
        background: dark ? 'rgba(198,132,42,0.15)' : '#fdf3e4',
        color: dark ? '#D4922E' : '#C6842A',
      }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
