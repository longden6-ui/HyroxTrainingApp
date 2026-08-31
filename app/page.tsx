export default function Home() {
  return (
    <main className="homepage">
      <section className="hero">
        <h1>HYROX Coach AI</h1>
        <p className="tagline">Your personalized path to race day</p>
        <p className="description">
          Get a free finish-time estimate, then build a day-by-day training plan that fits your schedule and targets your biggest obstacles.
        </p>
        <a href="/predict" className="cta-button">
          Get Your Finish Time Estimate
        </a>
      </section>

      <section className="features">
        <h2>How It Works</h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>1. Free Time Predictor</h3>
            <p>Enter your 5K time and race details to get an estimated finish-time range with confidence level.</p>
          </div>
          <div className="feature">
            <h3>2. Personalized Plan</h3>
            <p>Create an account to build a phased training plan that balances running, strength, and station skill.</p>
          </div>
          <div className="feature">
            <h3>3. Track Progress</h3>
            <p>Log workouts, track your progress, and adapt your plan based on how you feel and your schedule changes.</p>
          </div>
        </div>
      </section>

      <section className="about">
        <h2>What Is HYROX?</h2>
        <p>
          HYROX is a unique fitness competition combining 8 km of running with 8 obstacle stations. Athletes of all levels race in their local cities, making it accessible and competitive.
        </p>
        <p>
          Success requires running fitness, functional strength, obstacle skill, and mental resilience. HYROX Coach AI helps you build a realistic training plan that targets your individual weak points.
        </p>
      </section>

      <style jsx>{`
        .homepage {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        .hero {
          text-align: center;
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .hero h1 {
          font-size: 3rem;
          margin: 0 0 0.5rem 0;
        }

        .tagline {
          font-size: 1.5rem;
          margin: 0 0 1rem 0;
          opacity: 0.95;
        }

        .description {
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto 2rem;
          opacity: 0.9;
        }

        .cta-button {
          display: inline-block;
          padding: 1rem 2rem;
          background-color: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .features {
          padding: 4rem 2rem;
          background-color: #f9f9f9;
        }

        .features h2,
        .about h2 {
          text-align: center;
          font-size: 2rem;
          margin-top: 0;
          margin-bottom: 2rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .feature {
          background-color: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .feature h3 {
          margin-top: 0;
          color: #667eea;
        }

        .feature p {
          margin: 0.5rem 0 0 0;
          line-height: 1.6;
          color: #666;
        }

        .about {
          padding: 4rem 2rem;
        }

        .about p {
          max-width: 800px;
          margin: 0 auto 1.5rem;
          line-height: 1.8;
          font-size: 1.05rem;
        }

        .about p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 2rem 1rem;
          }

          .hero h1 {
            font-size: 2rem;
          }

          .tagline {
            font-size: 1.2rem;
          }

          .features,
          .about {
            padding: 2rem 1rem;
          }

          .features h2,
          .about h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}
