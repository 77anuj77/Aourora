export default function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const base = 'soft-btn px-4 py-2 text-sm font-medium flex items-center gap-2 justify-center';
  const color = variant === 'primary' ? 'text-white' : '';
  const style = variant === 'primary' ? { background: 'var(--primary)', color: '#fff' } : {};
  return <button className={`${base} ${color} ${className}`} style={style} {...props}>{children}</button>;
}
