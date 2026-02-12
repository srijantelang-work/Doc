import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero fade-in">
        <h1 className="hero-title">
          Your Documents,<br />Your Answers
        </h1>
        <p className="hero-subtitle">
          Upload your text documents and ask questions in natural language.
          Get AI-powered answers with exact source citations — always know
          where the information came from.
        </p>
        <div className="flex items-center gap-md" style={{ justifyContent: 'center' }}>
          <Link href="/documents" className="btn btn-primary btn-lg">
            Get Started →
          </Link>
          <Link href="/status" className="btn btn-secondary btn-lg">
            System Status
          </Link>
        </div>
      </section>

      <section className="steps-grid fade-in">
        <div className="step-card">
          <div className="step-number">1</div>
          <div className="step-icon">📄</div>
          <h3 className="step-title">Upload Documents</h3>
          <p className="step-desc">
            Add your text files. They&apos;re automatically chunked and indexed
            using AI embeddings for semantic search.
          </p>
        </div>

        <div className="step-card">
          <div className="step-number">2</div>
          <div className="step-icon">💬</div>
          <h3 className="step-title">Ask Questions</h3>
          <p className="step-desc">
            Type any question in natural language. Our AI searches through
            your documents to find the most relevant passages.
          </p>
        </div>

        <div className="step-card">
          <div className="step-number">3</div>
          <div className="step-icon">✨</div>
          <h3 className="step-title">Get Cited Answers</h3>
          <p className="step-desc">
            Receive accurate answers with source citations — see exactly
            which document and passage the answer came from.
          </p>
        </div>
      </section>

      <div className="powered-by">
        Powered by Google Gemini &middot; Built with Next.js
      </div>
    </div>
  );
}
