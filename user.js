import { supabase } from "./supabaseClient.js";

const usernameInput = document.getElementById("username");
const gamepassInput = document.getElementById("gamepass");
const submitBtn = document.getElementById("submitBtn");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUserId = null;

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
});

function loadMessages() {
  if (!currentUserId) return;

  supabase
    .channel("chat")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      if (payload.new.user_id === currentUserId) renderMessage(payload.new);
    })
    .subscribe();

  fetchMessages();
}

async function fetchMessages() {
  let { data } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: true });

  chatBox.innerHTML = "";
  data.forEach(renderMessage);
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.sender}: ${msg.text}`;
  chatBox.appendChild(div);
}
