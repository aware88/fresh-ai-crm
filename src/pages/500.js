export default function Custom500() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Server Error</h2>
      <p style={{ marginBottom: '2rem' }}>
        Sorry, something went wrong on our server. We're working to fix it.
      </p>
      <a href="/" style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: 'white', borderRadius: '0.25rem', textDecoration: 'none' }}>
        Return Home
      </a>
    </div>
  );
}
