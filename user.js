import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const gamepassInput = document.getElementById("gamepass");
  const submitBtn = document.getElementById("submitBtn");
  const chatBox = document.getElementById("chatBox");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  if (!usernameInput || !gamepassInput || !submitBtn || !chatBox || !messageInput || !sendBtn) {
    console.error("One or more DOM elements not found");
    return;
  }

  let currentUserId = null;
  let chatChannel = null;
  let pollingInterval = null;

  submitBtn.addEventListener("click", async () => {
    const username = usernameInput.value;
    const gamepass = gamepassInput.value;

    if (!username || !gamepass) {
      alert("Please fill all fields");
      return;
    }

    let { error } = await supabase.from("users").upsert([{ id: username, username, gamepass }]);
    if (error) {
      console.error("Error submitting request:", error.message);
      alert("Error submitting request");
      return;
    }

    currentUserId = username;
    alert("Request submitted! You can now chat.");
    loadMessages();
  });

  sendBtn.addEventListener("click", async () => {
    const text = messageInput.value;
    if (!text || !currentUserId) return;

    let { error } = await supabase.from("messages").insert([
      { user_id: currentUserId, sender: "user", text },
    ]);
    if (error) {
      console.error("Error sending message:", error.message);
      return;
    }

    messageInput.value = "";
    fetchMessages();
  });

  function loadMessages() {
    if (!currentUserId) return;

    if (chatChannel) {
      supabase.removeChannel(chatChannel);
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    chatChannel = supabase
      .channel(`chat-${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        console.log("Received postgres_changes event:", payload);
        if (payload.new.user_id === currentUserId) {
          console.log("Rendering new message:", payload.new);
          renderMessage(payload.new);
          fetchMessages(); // Sync full history
        } else {
          console.log("Message filtered out, user_id mismatch:", payload.new.user_id, currentUserId);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for user ${currentUserId}: ${status}`);
        if (status === "SUBSCRIBED") {
          fetchMessages();
        } else if (status === "CLOSED" || status === "ERROR") {
          console.warn("Subscription closed or errored, starting polling...");
          pollingInterval = setInterval(fetchMessages, 1000); // Poll every 1 second
        }
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
      console.error("Error fetching messages:", error.message);
      return;
    }

    console.log("Fetched messages:", data);
    chatBox.innerHTML = "";
    data.forEach(renderMessage);
  }

  function renderMessage(msg) {
    const existingMessages = Array.from(chatBox.children).map((div) => div.textContent);
    if (!existingMessages.includes(`${msg.sender}: ${msg.text}`)) {
      console.log("Appending message to UI:", msg);
      const div = document.createElement("div");
      div.textContent = `${msg.sender}: ${msg.text}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }
});
