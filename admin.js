import { supabase } from "./supabaseClient.js";

const ADMIN_USER = "Hexagon_Rules";
const ADMIN_PASS = "Ezhra_Eg_Eyafif_201315";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const dashboard = document.getElementById("dashboard");
  const requestsTable = document.querySelector("#requestsTable tbody");
  const chatBox = document.getElementById("chatBox");
  const adminMsg = document.getElementById("adminMsg");
  const sendBtn = document.getElementById("sendBtn");

  let selectedUser = null;
  let adminChatChannel = null;

  // Admin login
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

  // Load all requests
  async function loadRequests() {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Error loading requests:", error.message);
      return;
    }

    requestsTable.innerHTML = "";
    data.forEach((req) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${req.username}</td><td>${req.gamepass}</td><td><button data-id="${req.id}">Open Chat</button></td>`;
      tr.querySelector("button").addEventListener("click", () => openChat(req.id));
      requestsTable.appendChild(tr);
    });
  }

  // Open chat with a user
  function openChat(userId) {
    selectedUser = userId;
    chatBox.innerHTML = "";

    if (adminChatChannel) supabase.removeChannel(adminChatChannel);

    adminChatChannel = supabase
      .channel(`admin-chat-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          renderMessage(payload.new);
        }
      )
      .subscribe();

    fetchMessages(userId);
  }

  // Send admin message
  sendBtn.addEventListener("click", async () => {
    if (!selectedUser) return;
    const text = adminMsg.value;
    if (!text) return;

    const { error } = await supabase.from("messages").insert([
      { user_id: selectedUser, sender: "admin", text },
    ]);

    if (error) {
      console.error("Error sending message:", error.message);
    }

    adminMsg.value = "";
  });

  // Load past messages
  async function fetchMessages(userId) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error.message);
      return;
    }

    chatBox.innerHTML = "";
    data.forEach(renderMessage);
  }

  function renderMessage(msg) {
    const div = document.createElement("div");
    div.textContent = `${msg.sender}: ${msg.text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
