// A signed-in visitor has no business on the landing page: send them to the
// app. The mirror of src/main.jsx, which sends a visitor with no session from
// `/` to here. An access token is what app.jsx reads as "signed in" (phase
// 'app'); the key is src/connectors/tokens.js's — keep them in step.
//
// A separate file and not an inline <script> because the CSP in
// noHarmBack/docker/security_headers.conf allows scripts from 'self' only.
(function () {
  try {
    if (localStorage.getItem("nh_access")) {
      window.location.replace("/");
    }
  } catch (e) {}
})();
