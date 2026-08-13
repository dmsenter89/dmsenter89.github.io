document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".code-tabs").forEach(function (tabs) {
    var nav = tabs.querySelector(".code-tabs-nav");
    var panels = tabs.querySelectorAll(".code-tab-panel");

    panels.forEach(function (panel, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = panel.dataset.tabName || "Tab " + (i + 1);
      btn.className = "code-tab-btn" + (i === 0 ? " active" : "");

      btn.addEventListener("click", function () {
        nav.querySelectorAll(".code-tab-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        panels.forEach(function (p) {
          p.classList.remove("active");
        });
        btn.classList.add("active");
        panel.classList.add("active");
      });

      nav.appendChild(btn);
      panel.classList.toggle("active", i === 0);
    });
  });
});
