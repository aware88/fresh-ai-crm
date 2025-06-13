export default function Custom404() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a href="/" style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: 'white', borderRadius: '0.25rem', textDecoration: 'none' }}>
        Return Home
      </a>
    </div>
  );
}
