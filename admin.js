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

  if (!loginForm || !loginError || !dashboard || !requestsTable || !chatBox || !adminMsg || !sendBtn) {
    console.error("One or more DOM elements not found");
    return;
  }

  let selectedUser = null;
  let adminChatChannel = null;
  let pollingInterval = null;

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
    let { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error.message, error.details);
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

  function openChat(userId) {
    selectedUser = userId;
    chatBox.innerHTML = "";

    if (adminChatChannel) {
      supabase.removeChannel(adminChatChannel);
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    adminChatChannel = supabase
      .channel(`admin-chat-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (payload.new.user_id === selectedUser) {
          renderMessage(payload.new); // Append new message immediately
          fetchMessages(userId); // Refresh full history to ensure consistency
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for admin chat ${userId}: ${status}`);
        if (status === "SUBSCRIBED") {
          fetchMessages(userId);
        } else if (status === "CLOSED" || status === "ERROR") {
          console.warn("Subscription closed or errored, starting polling fallback...");
          pollingInterval = setInterval(() => fetchMessages(userId), 5000); // Fallback polling every 5 seconds
        }
      });

    fetchMessages(userId);
  }

  sendBtn.addEventListener("click", async () => {
    if (!selectedUser) return;
    const text = adminMsg.value;
    if (!text) return;

    let { error } = await supabase.from("messages").insert([
      { user_id: selectedUser, sender: "admin", text },
    ]);
    if (error) {
      console.error("Error sending message:", error.message);
      return;
    }

    adminMsg.value = "";
    fetchMessages(selectedUser);
  });

  async function fetchMessages(userId) {
    let { data, error } = await supabase
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
    const existingMessages = Array.from(chatBox.children).map((div) => div.textContent);
    if (!existingMessages.includes(`${msg.sender}: ${msg.text}`)) {
      const div = document.createElement("div");
      div.textContent = `${msg.sender}: ${msg.text}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }
});
