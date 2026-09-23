// Thin client for the Brightbits server. When no server is reachable (e.g. GitHub Pages),
// `online` stays false and the app runs entirely from localStorage.
window.BB_API = (function () {
  "use strict";

  var api = { online: false, billing: "off" };

  function request(method, path, body) {
    var opts = { method: method, credentials: "same-origin", headers: {} };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch("api/" + path, opts).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { /* not JSON */ }
        if (!res.ok) {
          var err = new Error((data && data.error) || "Request failed (" + res.status + ")");
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  api.init = function () {
    if (location.protocol === "file:") return Promise.resolve(false);
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 2500); });
    return Promise.race([request("GET", "health").catch(function () { return null; }), timeout]).then(function (h) {
      api.online = !!(h && h.ok);
      api.billing = (h && h.billing) || "off";
      return api.online;
    });
  };

  api.me = function () { return request("GET", "me"); };
  api.signup = function (data) { return request("POST", "auth/signup", data); };
  api.login = function (email, password) { return request("POST", "auth/login", { email: email, password: password }); };
  api.logout = function () { return request("POST", "auth/logout", {}); };
  api.updateProfile = function (data) { return request("PATCH", "me", data); };

  // Debounced so rapid taps collapse into one save.
  var pending = null, timer = null, onError = null;
  api.onSyncError = function (fn) { onError = fn; };
  api.saveState = function (state) {
    pending = state;
    clearTimeout(timer);
    timer = setTimeout(api.flush, 700);
  };
  api.flush = function () {
    clearTimeout(timer);
    if (!pending) return Promise.resolve();
    var body = { state: pending };
    pending = null;
    return request("PUT", "state", body).catch(function (e) { if (onError) onError(e); });
  };
  window.addEventListener("pagehide", function () {
    if (!pending) return;
    // keepalive lets the last save finish while the page unloads.
    fetch("api/state", { method: "PUT", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: pending }) });
    pending = null;
  });

  api.ideas = function () { return request("GET", "ideas"); };
  api.createIdea = function (idea) { return request("POST", "ideas", idea); };
  api.deleteIdea = function (id) { return request("DELETE", "ideas/" + encodeURIComponent(id), {}); };
  api.user = function (id) { return request("GET", "users/" + encodeURIComponent(id)); };
  api.follow = function (target, on) { return request(on ? "PUT" : "DELETE", "follows/" + encodeURIComponent(target), {}); };

  api.checkout = function (plan) { return request("POST", "billing/checkout", { plan: plan }); };
  api.portal = function () { return request("POST", "billing/portal", {}); };
  api.cancel = function () { return request("POST", "billing/cancel", {}); };

  return api;
})();
