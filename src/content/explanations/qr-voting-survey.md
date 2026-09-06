---
---

<h3>🌟 High-Level Flow (Non-Technical)</h3>

<ol class="flow">
  <li><span class="step">👤 Anonymous access</span> — Each participant gets a unique QR code that represents them anonymously; no personal information is stored.</li>
  <li><span class="step">📲 Scan &amp; access</span> — Scanning the QR opens a secure voting link, which verifies the participant and grants access.</li>
  <li><span class="step">📝 Cast a vote</span> — The user selects their choice(s) and submits.</li>
  <li><span class="step">✅ Secure validation</span> — Each vote is checked, stored anonymously, and linked to its unique QR code.</li>
  <li><span class="step">🚫 One vote per person</span> — A QR can only be used once. Any duplicate attempt is automatically blocked.</li>
  <li><span class="step">📊 Results for admins</span> — Only administrators can log in to view aggregated results in real time.</li>
</ol>

<details class="details-card" id="tech-details">
  <summary>
    🔧 Technical Details (For Developers)
    <span class="chevron" aria-hidden="true">▾</span>
  </summary>
  <div class="details-body">
    <h4>🔄 Application Flow</h4>
    <figure class="schema-figure">
      <span class="schema-wrap zoomable">
        <img src="/projects/schema_qr.png" alt="QR voting and authentication flow diagram" class="schema-img" width="1808" height="703" loading="lazy" decoding="async" />
        <span class="zoom-hint">🔍 Click to zoom</span>
      </span>
      <figcaption>QR voting flow between services.</figcaption>
    </figure>
    <p>In the <code>qr_application</code> service, QR codes are linked to anonymous users (<code>user_1</code>, <code>password</code>, e.g.), with encrypted passwords stored in the database.</p>
    <ol class="steps">
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">1</span>
        <div class="step-content">
          <h5>Setup endpoints</h5>
          <p>Two setup endpoints generate the QR codes before participants can vote:</p>
          <ul class="endpoint-list">
            <li class="endpoint">
              <code class="endpoint-path">POST /token/generate</code>
              <p class="endpoint-desc">Provide username and password to validate against the database and generate a token signed with the <code>qr_application</code> secret.</p>
            </li>
            <li class="endpoint">
              <code class="endpoint-path">POST /qr</code>
              <p class="endpoint-desc">Create the QR code, authenticating with the token from step 2.a (User Auth).</p>
            </li>
          </ul>
        </div>
      </li>
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">2</span>
        <div class="step-content">
          <h5>Embed the token</h5>
          <p>The generated JWT is embedded in the QR code's URL, which participants later scan.</p>
        </div>
      </li>
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">3</span>
        <div class="step-content">
          <h5>Scan &amp; access</h5>
          <p>Scanning a QR opens <code>/vote:&lt;token&gt;</code> from the dashboard. The token is a JWT signed with a shared secret between Django microservices — the same token generated in step 2.</p>
        </div>
      </li>
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">4</span>
        <div class="step-content">
          <h5>Cast a vote</h5>
          <p>On the <code>vote</code> page, the user selects an option and submits. Submission calls <code>/token/validate/?option=&lt;option&gt;</code> in the <code>qr_application</code> service (User Auth).</p>
        </div>
      </li>
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">5</span>
        <div class="step-content">
          <h5>Validate &amp; enforce one use</h5>
          <p>If valid, the vote is saved and <code>token_used</code> is set to <code>True</code>. In other case, the page returns a controlled error and no vote is saved. Any attempt to reuse a token is blocked (<code>token_used = True</code>) and a controlled error page is shown.</p>
        </div>
      </li>
      <li class="step-item">
        <span class="step-badge" aria-hidden="true">6</span>
        <div class="step-content">
          <h5>Admin access</h5>
          <p>Admins log into <code>qr_dashboard</code> with Admin Auth to view aggregated voting graphs (via <code>/metrics</code> endpoint in <code>qr_application</code>). Typical flow: <code>/login</code> → <code>/dashboard</code> → <code>/metrics</code>. Tokens are stored in the session for ongoing auth and cleared on logout.</p>
        </div>
      </li>
    </ol>
    <h4>🔐 Authentication Types</h4>
    <div class="auth-grid">
      <div class="auth-card">
        <h5>🔑 JWT Auth</h5>
        <p>✅ Valid if token not expired and signed with shared secret.</p>
        <p class="purpose">📌 Purpose: General token verification between services.</p>
      </div>
      <div class="auth-card">
        <h5>🛡️ Admin Auth</h5>
        <p>✅ Token valid, user exists in DB, and is admin.</p>
        <p class="purpose">📌 Purpose: Grants administrators access to the dashboard and voting metrics.</p>
      </div>
      <div class="auth-card">
        <h5>🙋 User Auth</h5>
        <p>✅ Token valid, user exists in DB, and is not admin.</p>
        <p class="purpose">📌 Purpose: Used for participant actions (e.g., generating QR, submitting a vote).</p>
      </div>
      <div class="auth-card">
        <h5>🤝 Server-to-Server Auth</h5>
        <p>✅ Token valid and signed with shared secret.</p>
        <p class="purpose">📌 Purpose: Secures internal communication between Django microservices.</p>
      </div>
    </div>
  </div>
</details>
