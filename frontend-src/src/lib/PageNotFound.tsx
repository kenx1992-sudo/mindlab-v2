import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-muted-foreground mb-8">搵唔到呢一頁</p>
      <Link to="/" className="text-accent underline underline-offset-2">返去首頁</Link>
    </div>
  );
}
