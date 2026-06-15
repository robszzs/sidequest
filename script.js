const SUPABASE_URL = "https://xkacviqnhrtnnjipqoym.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYWN2aXFuaHJ0bm5qaXBxb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjE4NDQsImV4cCI6MjA5Njk5Nzg0NH0.ecGHRxJjxFkN7ABbxtho8ng2WmUUaCUwPwH277Ryrrs";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUsername = localStorage.getItem("sidequest-username");
let games = [];
let currentRating = 0;
let currentGame = null;

const welcomeScreen = document.getElementById("welcome-screen");
const usernameInput = document.getElementById("username-input");
const usernameSubmitBtn = document.getElementById("username-submit-btn");

function setUsername(name) {
  currentUsername = name;
  localStorage.setItem("sidequest-username", currentUsername);
  document.getElementById("current-username").textContent = currentUsername;
  document.getElementById("hero-username").textContent = currentUsername;
  const avatar = document.getElementById("username-avatar");
  if (avatar) avatar.textContent = currentUsername.charAt(0).toUpperCase();
}

if (!currentUsername) {
  welcomeScreen.classList.remove("hidden");
} else {
  setUsername(currentUsername);
  loadGames();
}

function submitUsername() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.style.borderColor = "#f87171";
    return;
  }
  setUsername(name);
  welcomeScreen.classList.add("hidden");
  loadGames();
}

usernameSubmitBtn.addEventListener("click", submitUsername);
usernameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") submitUsername();
});

// custom confirm dialog
function showConfirm(message, onConfirm) {
  const overlay = document.getElementById("confirm-overlay");
  document.getElementById("confirm-message").textContent = message;
  overlay.classList.remove("hidden");

  const okBtn = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");

  const newOk = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  cancelBtn.replaceWith(newCancel);

  function close() {
    overlay.classList.add("hidden");
  }

  newOk.addEventListener("click", function () {
    close();
    onConfirm();
  });

  newCancel.addEventListener("click", function () {
    close();
  });
}

const gameListEl = document.getElementById("game-list");

// stats
function updateStats() {
  const totalGames = games.length;
  let totalHours = 0;
  for (let i = 0; i < games.length; i++) totalHours += games[i].hours;

  const ratedGames = games.filter(function (g) { return g.rating > 0; });
  let avgRating = "—";
  if (ratedGames.length > 0) {
    let sum = 0;
    for (let i = 0; i < ratedGames.length; i++) sum += ratedGames[i].rating;
    avgRating = (sum / ratedGames.length).toFixed(1);
  }

  document.getElementById("stat-games").textContent = totalGames;
  document.getElementById("stat-hours").textContent = totalHours + "h";
  document.getElementById("stat-rating").textContent = avgRating;
}

// stars
function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) stars += i <= rating ? "★" : "☆";
  return stars;
}

function setupStarPicker() {
  document.querySelectorAll(".star-pick").forEach(function (star) {
    star.addEventListener("click", function () {
      currentRating = parseInt(star.dataset.value);
      updateStarPicker(currentRating);
    });
    star.addEventListener("mouseover", function () { updateStarPicker(parseInt(star.dataset.value)); });
    star.addEventListener("mouseout", function () { updateStarPicker(currentRating); });
  });
}

function updateStarPicker(rating) {
  document.querySelectorAll(".star-pick").forEach(function (star) {
    parseInt(star.dataset.value) <= rating
      ? star.classList.add("active")
      : star.classList.remove("active");
  });
}

// cards
function createGameCard(game) {
  return `
    <div class="game-card" onclick='openDetail(${JSON.stringify(game).replace(/'/g, "&#39;")})'>
      <img src="${game.cover}" alt="${game.title}" class="game-cover">
      <div class="game-info">
        <div class="game-top">
          <h3 class="game-title">${game.title}</h3>
          <span class="game-status status-${game.status}">${game.status}</span>
        </div>
        <div class="game-meta">
          <span>${game.platform}</span>
          <span>${game.hours}h</span>
          <span>${game.date}</span>
        </div>
        <div class="game-rating">${generateStars(game.rating)}</div>
        <p class="game-review">${game.review || ""}</p>
      </div>
    </div>
  `;
}

function renderGames(gamesToShow) {
  if (gamesToShow.length === 0) {
    gameListEl.innerHTML = `
      <div class="empty-state">
        <p>No games logged yet.</p>
        <p>Click <strong>+ Log game</strong> to add your first one!</p>
      </div>
    `;
    return;
  }
  gameListEl.innerHTML = gamesToShow.map(createGameCard).join("");
}

// load from supabase
async function loadGames() {
  const { data, error } = await supabaseClient
    .from("games")
    .select("*")
    .eq("username", currentUsername)
    .order("id", { ascending: false });

  if (error) { console.log("Error loading games:", error); return; }
  games = data;
  renderGames(games);
  updateStats();
}

// filters
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const status = button.dataset.status;
    const filtered = status === "all" ? games : games.filter(function (g) { return g.status === status; });
    renderGames(filtered);
    filterButtons.forEach(function (btn) { btn.classList.remove("active"); });
    button.classList.add("active");
  });
});

// modal open/close
const addGameBtn = document.getElementById("add-game-btn");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal-btn");

addGameBtn.addEventListener("click", function () {
  currentRating = 0;
  updateStarPicker(0);
  modalOverlay.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", function () {
  modalOverlay.classList.add("hidden");
  currentGame = null;
});

// form
const saveGameBtn = document.getElementById("save-game-btn");
const inputTitle = document.getElementById("input-title");
const inputPlatform = document.getElementById("input-platform");
const inputStatus = document.getElementById("input-status");
const inputHours = document.getElementById("input-hours");
const inputReview = document.getElementById("input-review");

setupStarPicker();

function resetForm() {
  inputTitle.value = "";
  inputHours.value = "";
  inputReview.value = "";
  inputPlatform.value = "PC";
  inputStatus.value = "playing";
  inputTitle.dataset.cover = "";
  document.getElementById("search-results").innerHTML = "";
  currentRating = 0;
  updateStarPicker(0);
}

saveGameBtn.addEventListener("click", async function () {
  if (!inputTitle.value.trim()) return;
  const isEditing = currentGame !== null;

  const gameData = {
    title: inputTitle.value.trim(),
    cover: inputTitle.dataset.cover || "https://placehold.co/300x400/1a1917/a8a29e?text=" + encodeURIComponent(inputTitle.value.trim()),
    platform: inputPlatform.value,
    status: inputStatus.value,
    hours: Number(inputHours.value) || 0,
    date: isEditing ? currentGame.date : new Date().toISOString().slice(0, 10),
    rating: currentRating,
    review: inputReview.value,
    username: currentUsername
  };

  if (isEditing) {
    const { error } = await supabaseClient.from("games").update(gameData).eq("id", currentGame.id);
    if (error) { console.log("Error updating:", error); return; }
    games = games.map(function (g) { return g.id === currentGame.id ? { ...g, ...gameData } : g; });
  } else {
    const { data, error } = await supabaseClient.from("games").insert([gameData]).select();
    if (error) { console.log("Error saving:", error); return; }
    games.unshift(data[0]);
  }

  renderGames(games);
  updateStats();
  modalOverlay.classList.add("hidden");
  currentGame = null;
  resetForm();
});

// RAWG search
async function searchGames(query) {
  try {
    const response = await fetch(`/api/games?search=${encodeURIComponent(query)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.results) return data.results;
    }
  } catch (e) {}

  try {
    const RAWG_KEY = "a28f3ebc4480464e9bdca5fc9a9d747e";
    const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(query)}&page_size=6`);
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.log("RAWG search failed:", e);
    return [];
  }
}

let searchTimeout;
inputTitle.addEventListener("input", function () {
  clearTimeout(searchTimeout);
  const query = inputTitle.value.trim();
  if (query.length < 2) {
    document.getElementById("search-results").innerHTML = "";
    return;
  }
  searchTimeout = setTimeout(async function () {
    const results = await searchGames(query);
    showSearchResults(results);
  }, 400);
});

function showSearchResults(results) {
  const container = document.getElementById("search-results");
  if (!results || results.length === 0) {
    container.innerHTML = "<p class='no-results'>No games found</p>";
    return;
  }
  container.innerHTML = results.map(function (game) {
    const cover = game.background_image || "https://placehold.co/300x400/1a1917/a8a29e?text=No+Cover";
    return `
      <div class="search-result" data-title="${game.name}" data-cover="${cover}">
        <img src="${cover}" alt="${game.name}">
        <span>${game.name}</span>
      </div>
    `;
  }).join("");
  container.querySelectorAll(".search-result").forEach(function (item) {
    item.addEventListener("click", function () {
      inputTitle.value = item.dataset.title;
      inputTitle.dataset.cover = item.dataset.cover;
      container.innerHTML = "";
    });
  });
}

// detail modal
const detailOverlay = document.getElementById("detail-overlay");
const detailClose = document.getElementById("detail-close");
const detailDeleteBtn = document.getElementById("detail-delete-btn");
const detailEditBtn = document.getElementById("detail-edit-btn");

function openDetail(game) {
  currentGame = game;
  document.getElementById("detail-bg").style.backgroundImage = `url('${game.cover}')`;
  document.getElementById("detail-cover").src = game.cover;
  document.getElementById("detail-cover").alt = game.title;
  document.getElementById("detail-title").textContent = game.title;
  const statusEl = document.getElementById("detail-status");
  statusEl.textContent = game.status;
  statusEl.className = `game-status status-${game.status}`;
  document.getElementById("detail-meta").innerHTML = `
    <span>${game.platform}</span>
    <span>${game.hours}h played</span>
    <span>${game.date}</span>
  `;
  document.getElementById("detail-rating").textContent = generateStars(game.rating);
  document.getElementById("detail-review").textContent = game.review || "No review written.";
  detailOverlay.classList.remove("hidden");
}

detailClose.addEventListener("click", function () {
  detailOverlay.classList.add("hidden");
  currentGame = null;
});

detailOverlay.addEventListener("click", function (e) {
  if (e.target === detailOverlay) {
    detailOverlay.classList.add("hidden");
    currentGame = null;
  }
});

detailDeleteBtn.addEventListener("click", function () {
  if (!currentGame) return;
  showConfirm(`Delete "${currentGame.title}"?`, async function () {
    const { error } = await supabaseClient.from("games").delete().eq("id", currentGame.id);
    if (error) { console.log("Error deleting:", error); return; }
    games = games.filter(function (g) { return g.id !== currentGame.id; });
    renderGames(games);
    updateStats();
    detailOverlay.classList.add("hidden");
    currentGame = null;
  });
});

detailEditBtn.addEventListener("click", function () {
  if (!currentGame) return;
  inputTitle.value = currentGame.title;
  inputTitle.dataset.cover = currentGame.cover;
  inputPlatform.value = currentGame.platform;
  inputStatus.value = currentGame.status;
  inputHours.value = currentGame.hours;
  inputReview.value = currentGame.review || "";
  currentRating = currentGame.rating;
  updateStarPicker(currentRating);
  detailOverlay.classList.add("hidden");
  modalOverlay.classList.remove("hidden");
});

// change user
document.getElementById("change-user-btn").addEventListener("click", function () {
  showConfirm("Switch user? Your games will still be saved.", function () {
    localStorage.removeItem("sidequest-username");
    location.reload();
  });
});