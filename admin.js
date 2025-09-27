import { supabase } from "./supabaseClient.js";

const ADMIN_USER = "Hexagon_Rules";
const ADMIN_PASS = "Ezhra_Eg_Eyafif_201315";

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const dashboard = document.getElementById("dashboard");
const requestsTable = document.querySelector("#requestsTable tbody");
const chatBox = document.getElementById("chatBox");
const adminMsg = document.getElementById("adminMsg");
const sendBtn = document.getElementById("sendBtn");

let selectedUser = null;

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("adminUsername").value;
  const pass = document.getElementById("adminPassword").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    loginForm.style.display = "none";
    dashboard.style.display = "block";
    loadRequests();
  } else {
    loginError.style.display = "block";
  }
});

async function loadRequests() {
  let { data } = await supabase.from("users").select("*");
  requestsTable.innerHTML = "";
  data.forEach((req) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${req.username}</td><td>${req.gamepass}</td><td><button data-id="${req.id}">Open Chat</button></td>`;
    tr.querySelector("button").addEventListener("click", () => openChat(req.id));
    requestsTable.appendChild(tr);
  });
}

function openChat(userId) {
  selectedUser = userId;
  chatBox.innerHTML = "";

  supabase
    .channel("admin-chat")
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
      if (payload.new.user_id === selectedUser) renderMessage(payload.new);
    })
    .subscribe();

  fetchMessages(userId);
}

sendBtn.addEventListener("click", async () => {
  if (!selectedUser) return;
  const text = adminMsg.value;
  if (!text) return;

  await supabase.from("messages").insert([
    { user_id: selectedUser, sender: "admin", text },
  ]);

  adminMsg.value = "";
});

async function fetchMessages(userId) {
  let { data } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  chatBox.innerHTML = "";
  data.forEach(renderMessage);
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.sender}: ${msg.text}`;
  chatBox.appendChild(div);
}