import { supabase } from "./supabaseClient.js";

const usernameInput = document.getElementById("username");
const gamepassInput = document.getElementById("gamepass");
const submitBtn = document.getElementById("submitBtn");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUserId = null;
let chatChannel = null;

submitBtn.addEventListener("click", async () => {
  const username = usernameInput.value;
  const gamepass = gamepassInput.value;

  if (!username || !gamepass) {
    alert("Please fill all fields");
    return;
  }

  await supabase.from("users").upsert([{ id: username, username, gamepass }]);
  currentUserId = username;
  alert("Request submitted! You can now chat.");
  loadMessages();
});

sendBtn.addEventListener("click", async () => {
  const text = messageInput.value;
  if (!text || !currentUserId) return;

  await supabase.from("messages").insert([
    { user_id: currentUserId, sender: "user", text },
  ]);

  messageInput.value = "";
  fetchMessages(); // Refresh messages immediately after sending
});

function loadMessages() {
  if (!currentUserId) return;

  // Unsubscribe from previous channel if it exists
  if (chatChannel) {
    supabase.removeChannel(chatChannel);
  }

  // Subscribe to a unique channel for this user
  chatChannel = supabase
    .channel(`chat-${currentUserId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      if (payload.new.user_id === currentUserId) {
        renderMessage(payload.new);
      }
    })
    .subscribe((status) => {
      console.log(`Subscription status for user ${currentUserId}: ${status}`);
    });

  fetchMessages();
}

async function fetchMessages() {
  let { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return;
  }

  chatBox.innerHTML = "";
  data.forEach(renderMessage);
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.sender}: ${msg.text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
}
