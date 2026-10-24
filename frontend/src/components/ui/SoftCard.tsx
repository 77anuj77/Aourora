export default function SoftCard({ children, className = '', ...props }: any) {
  return <div className={`soft-card p-5 ${className}`} {...props}>{children}</div>;
}
