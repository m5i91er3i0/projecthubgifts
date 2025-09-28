import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const gamepassInput = document.getElementById("gamepass");
  const submitBtn = document.getElementById("submitBtn");
  const chatBox = document.getElementById("chatBox");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  let currentUserId = null;
  let chatChannel = null;

  // Submit request
  submitBtn.addEventListener("click", async () => {
    const username = usernameInput.value;
    const gamepass = gamepassInput.value;

    if (!username || !gamepass) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase
      .from("users")
      .upsert([{ id: username, username, gamepass }]);

    if (error) {
      console.error("Error submitting request:", error.message);
      alert("Error submitting request");
      return;
    }

    currentUserId = username;
    alert("Request submitted! You can now chat.");
    loadMessages();
  });

  // Send message
  sendBtn.addEventListener("click", async () => {
    const text = messageInput.value;
    if (!text || !currentUserId) return;

    const { error } = await supabase.from("messages").insert([
      { user_id: currentUserId, sender: "user", text },
    ]);

    if (error) {
      console.error("Error sending message:", error.message);
    }

    messageInput.value = "";
  });

  // Subscribe to realtime + fetch history
  function loadMessages() {
    if (!currentUserId) return;

    if (chatChannel) supabase.removeChannel(chatChannel);

    chatChannel = supabase
      .channel(`chat-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          renderMessage(payload.new);
        }
      )
      .subscribe();

    fetchMessages();
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", currentUserId)
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
