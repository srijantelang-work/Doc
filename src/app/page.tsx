import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero fade-in">
        <h1 className="hero-title">
          Your Documents,<br />Your Answers
        </h1>
        <p className="hero-subtitle">
          Ask questions. Get cited answers.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/documents" className="btn btn-primary btn-lg">
            Get Started →
          </Link>
          <Link href="/status" className="btn btn-secondary btn-lg">
            System Status
          </Link>
        </div>
      </section>

      <section className="timeline fade-in">
        <div className="timeline-step">
          <div className="timeline-dot">1</div>
          <div className="timeline-label">Upload</div>
          <div className="timeline-desc">
            Add your text files. Automatically chunked and indexed with AI embeddings.
          </div>
        </div>

        <div className="timeline-step">
          <div className="timeline-dot">2</div>
          <div className="timeline-label">Ask</div>
          <div className="timeline-desc">
            Type any question in natural language. We search your documents semantically.
          </div>
        </div>

        <div className="timeline-step">
          <div className="timeline-dot">3</div>
          <div className="timeline-label">Cited Answers</div>
          <div className="timeline-desc">
            Receive accurate answers with exact source citations from your documents.
          </div>
        </div>
      </section>

      <div className="powered-by">
        Powered by Google Gemini &middot; Built with Next.js
      </div>
    </div>
  );
}
