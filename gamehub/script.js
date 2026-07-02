(function () {
  "use strict";

  // ----------------------------------------------------------------
  // GAMES DATABASE
  // Add a new game by adding an object to this array.
  //
  //   id:        unique short string, used internally
  //   title:     display name shown under the thumbnail
  //   category:  small label shown under the title (e.g. "Board", "Puzzle")
  //   src:       path/filename of the game's html file (used in the iframe).
  //              Leave as "" if the game isn't built yet — the hub will
  //              show a friendly "coming soon" message instead of a broken page.
  //   isNew:     true/false — shows a small "NEW" badge on the thumbnail
  //   iconShape: which built-in thumbnail icon to draw ("grid", "dice",
  //              "controller", "puzzle", "star", "bolt") — purely visual,
  //              picked per game so every card looks distinct without
  //              needing external image files.
  //   colorFrom / colorTo: hex colors for the thumbnail's gradient background
  // ----------------------------------------------------------------
  var gamesDatabase = [
    {
      id: "tic-tac-toe",
      title: "Tic Tac Toe",
      category: "Board",
      src: "tic-tac-toe.html",
      isNew: true,
      iconShape: "grid",
      colorFrom: "#2f6f6e",
      colorTo: "#173b3a"
    },
    {
  id: "ludo",
  title: "Ludo",
  category: "Board",
  src: "ludo.html",
  isNew: true,
  iconShape: "dice",
  colorFrom: "#3a6b3f",
  colorTo: "#1c3a1f"
    },
    {
  id: "chess",
  title: "Chess",
  category: "Board",
  src: "chess.html",
  isNew: true,
  iconShape: "controller",
  colorFrom: "#6b4423",
  colorTo: "#2e1d10"
    },
    { 
    id: "snake", 
    title: "Snake", 
    category: "Arcade", 
    src: "snake.html", 
    isNew: true, 
    iconShape: "bolt", 
    colorFrom: "#3a8e5c", 
    colorTo: "#1a3d28" 
    },
    {
    id: "towerblocks",
    title: "Tower Blocks",
    category: "Arcade",
    src: "towerblock.html",
    isNew: true,
    iconShape: "bolt",
    colorFrom: "#D0CBC7",
    colorTo: "#333344"
    }
  ];

  var favorites = {};
  var currentTab = "all"; // "all" | "favorite"
  var currentQuery = "";

  // ----------------------------------------------------------------
  // Icon library (inline SVG per iconShape, so no external assets needed)
  // ----------------------------------------------------------------
  function iconSvg(shape) {
    switch (shape) {
      case "grid":
        return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="2" stroke-opacity="0.55"></rect>' +
          '<line x1="3" y1="9" x2="21" y2="9" stroke-opacity="0.55"></line>' +
          '<line x1="3" y1="15" x2="21" y2="15" stroke-opacity="0.55"></line>' +
          '<line x1="9" y1="3" x2="9" y2="21" stroke-opacity="0.55"></line>' +
          '<line x1="15" y1="3" x2="15" y2="21" stroke-opacity="0.55"></line>' +
          '<path d="M5.5 5.5l3 3M8.5 5.5l-3 3" stroke="#f2c75c" stroke-width="2"></path>' +
          '<circle cx="18" cy="7" r="2" stroke="#5dd6e3" stroke-width="2"></circle>' +
          '<circle cx="12" cy="18" r="2" stroke="#5dd6e3" stroke-width="2"></circle>' +
          "</svg>";
      case "dice":
        return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">' +
          '<rect x="4" y="4" width="16" height="16" rx="3" stroke-opacity="0.6"></rect>' +
          '<circle cx="9" cy="9" r="1.3" fill="white" stroke="none"></circle>' +
          '<circle cx="15" cy="9" r="1.3" fill="white" stroke="none"></circle>' +
          '<circle cx="9" cy="15" r="1.3" fill="white" stroke="none"></circle>' +
          '<circle cx="15" cy="15" r="1.3" fill="white" stroke="none"></circle>' +
          '<circle cx="12" cy="12" r="1.3" fill="#f2c75c" stroke="none"></circle>' +
          "</svg>";
      case "controller":
        return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M6 9h12l1.5 7a2 2 0 0 1-3.6 1.4L14 15h-4l-1.9 2.4A2 2 0 0 1 4.5 16L6 9z"></path>' +
          '<line x1="8.5" y1="11.5" x2="8.5" y2="13.5"></line>' +
          '<line x1="7.5" y1="12.5" x2="9.5" y2="12.5"></line>' +
          '<circle cx="16" cy="11.5" r="0.8" fill="white" stroke="none"></circle>' +
          '<circle cx="14.3" cy="13.2" r="0.8" fill="white" stroke="none"></circle>' +
          "</svg>";
      case "puzzle":
        return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round">' +
          '<path d="M9 4h4v2.2a1.6 1.6 0 0 0 3.2 0V4H20v4h-2.2a1.6 1.6 0 0 0 0 3.2H20v4h-3.8v-2.2a1.6 1.6 0 0 0-3.2 0V15H9v-2.2a1.6 1.6 0 0 0-3.2 0V15H4v-4h2.2a1.6 1.6 0 0 0 0-3.2H4V4h3.8v2.2a1.6 1.6 0 0 0 3.2 0V4z" stroke-opacity="0.85"></path>' +
          "</svg>";
      case "star":
        return '<svg viewBox="0 0 24 24" fill="white" fill-opacity="0.9" stroke="none">' +
          '<path d="M12 2.5l2.9 6.1 6.6.7-5 4.6 1.4 6.6L12 17l-5.9 3.5 1.4-6.6-5-4.6 6.6-.7L12 2.5z"></path>' +
          "</svg>";
      case "bolt":
        return '<svg viewBox="0 0 24 24" fill="white" fill-opacity="0.9" stroke="none">' +
          '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"></path>' +
          "</svg>";
      default:
        return '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="8"></circle></svg>';
    }
  }

  // ----------------------------------------------------------------
  // DOM refs
  // ----------------------------------------------------------------
  var gridEl = document.getElementById("game-grid");
  var emptyStateEl = document.getElementById("empty-state");
  var emptyTitleEl = document.getElementById("empty-title");
  var emptySubEl = document.getElementById("empty-sub");
  var sectionLabelEl = document.getElementById("section-label");
  var searchInput = document.getElementById("search-input");
  var clearSearchBtn = document.getElementById("clear-search");
  var tabAllBtn = document.getElementById("tab-all");
  var tabFavoriteBtn = document.getElementById("tab-favorite");
  var trophyBtn = document.getElementById("trophy-btn");

  var playerOverlay = document.getElementById("player-overlay");
  var playerTitle = document.getElementById("player-title");
  var playerFrameWrap = document.getElementById("player-frame-wrap");
  var playerBack = document.getElementById("player-back");

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  function getFilteredGames() {
    var query = currentQuery.trim().toLowerCase();
    return gamesDatabase.filter(function (game) {
      if (currentTab === "favorite" && !favorites[game.id]) return false;
      if (query && game.title.toLowerCase().indexOf(query) === -1) return false;
      return true;
    });
  }

  function renderGrid() {
    var games = getFilteredGames();
    gridEl.innerHTML = "";

    if (games.length === 0) {
      gridEl.style.display = "none";
      emptyStateEl.classList.add("show");
      if (currentQuery.trim()) {
        emptyTitleEl.textContent = "No games found";
        emptySubEl.textContent = 'Nothing matches "' + currentQuery.trim() + '". Try a different search term.';
      } else if (currentTab === "favorite") {
        emptyTitleEl.textContent = "No favorites yet";
        emptySubEl.textContent = "Tap the heart on any game card to add it here.";
      }
      return;
    }

    gridEl.style.display = "grid";
    emptyStateEl.classList.remove("show");

    games.forEach(function (game) {
      gridEl.appendChild(buildCard(game));
    });
  }

  function buildCard(game) {
    var card = document.createElement("div");
    card.className = "game-card";
    card.setAttribute("data-id", game.id);

    var thumb = document.createElement("div");
    thumb.className = "game-thumb";
    thumb.style.background = "linear-gradient(155deg, " + game.colorFrom + ", " + game.colorTo + ")";
    thumb.innerHTML = iconSvg(game.iconShape);

    if (game.isNew) {
      var badge = document.createElement("span");
      badge.className = "new-badge";
      badge.textContent = "New";
      thumb.appendChild(badge);
    }

    var favBtn = document.createElement("button");
    favBtn.className = "favorite-toggle" + (favorites[game.id] ? " active" : "");
    favBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21s-7-4.5-9.5-9C.8 8.5 2 5 5.2 4.2 7.6 3.6 10 4.8 12 7c2-2.2 4.4-3.4 6.8-2.8C22 5 23.2 8.5 21.5 12 19 16.5 12 21 12 21z"></path></svg>';
    favBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleFavorite(game.id);
    });
    thumb.appendChild(favBtn);

    var info = document.createElement("div");
    info.className = "game-info";
    info.innerHTML =
      '<p class="game-title">' + escapeHtml(game.title) + '</p>' +
      '<p class="game-category">' + escapeHtml(game.category) + '</p>';

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener("click", function () {
      openGame(game);
    });

    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function toggleFavorite(id) {
    favorites[id] = !favorites[id];
    renderGrid();
  }

  // ----------------------------------------------------------------
  // Tabs
  // ----------------------------------------------------------------
  function setTab(tab) {
    currentTab = tab;
    tabAllBtn.classList.toggle("active", tab === "all");
    tabFavoriteBtn.classList.toggle("active", tab === "favorite");
    sectionLabelEl.textContent = tab === "all" ? "All Games" : "Favorite Games";
    renderGrid();
  }

  tabAllBtn.addEventListener("click", function () { setTab("all"); });
  tabFavoriteBtn.addEventListener("click", function () { setTab("favorite"); });
  trophyBtn.addEventListener("click", function () { setTab("favorite"); });

  // ----------------------------------------------------------------
  // Search
  // ----------------------------------------------------------------
  searchInput.addEventListener("input", function () {
    currentQuery = searchInput.value;
    clearSearchBtn.classList.toggle("show", currentQuery.length > 0);
    renderGrid();
  });

  clearSearchBtn.addEventListener("click", function () {
    searchInput.value = "";
    currentQuery = "";
    clearSearchBtn.classList.remove("show");
    renderGrid();
    searchInput.focus();
  });

  // ----------------------------------------------------------------
  // Game player overlay
  // ----------------------------------------------------------------
  function openGame(game) {
    playerTitle.textContent = game.title;
    playerFrameWrap.innerHTML = "";

    if (game.src && game.src.trim()) {
      var iframe = document.createElement("iframe");
      iframe.src = game.src;
      iframe.setAttribute("title", game.title);
      playerFrameWrap.appendChild(iframe);
    } else {
      var msg = document.createElement("div");
      msg.className = "no-game-msg";
      msg.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
        '<circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="13"></line>' +
        '<circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none"></circle></svg>' +
        '<p class="msg-title">' + escapeHtml(game.title) + " isn't ready yet</p>" +
        '<p class="msg-sub">This game is still being built. Check back soon!</p>';
      playerFrameWrap.appendChild(msg);
    }

    playerOverlay.classList.add("show");
  }

  function closeGame() {
    playerOverlay.classList.remove("show");
    playerFrameWrap.innerHTML = "";
  }

  playerBack.addEventListener("click", closeGame);

  // ----------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------
  renderGrid();
})();

