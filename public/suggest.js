// The suggestion box on the landing page: opens the visitor's mail app with
// the text already in it. The same thing src/services/suggestions.js does in
// Settings — address, subject and limit are written twice, keep them in step.
//
// A script and not a plain <form action="mailto:">: the CSP's form-action is
// 'self', which blocks a mailto submission, and a GET form encodes spaces as
// '+' that mail clients show literally.
(function () {
  var form = document.getElementById("suggest-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = form.elements.suggestion.value.trim();
    if (!text) return;
    window.location.href =
      "mailto:suggestions@noharm.site?subject=" +
      encodeURIComponent("NoHarm suggestion") +
      "&body=" +
      encodeURIComponent(text);
  });
})();
