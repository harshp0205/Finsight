interface BadgeProps { label: string; variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }

const colors = {
  green:  'bg-green-900/40 text-green-400 border-green-800',
  red:    'bg-red-900/40 text-red-400 border-red-800',
  yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  blue:   'bg-blue-900/40 text-blue-400 border-blue-800',
  gray:   'bg-gray-800 text-gray-400 border-gray-700',
};

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[variant]}`}>
      {label}
    </span>
  );
}
