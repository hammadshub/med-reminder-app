import { useState } from "react";
import "./App.css";

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_CHAT_API_KEY;


  const predefinedQuestions = [
    "What to do if I miss a dose?",
    "Can I take two medicines together?",
  ];

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18',
          messages: newMessages,
          stream: true,
          max_tokens: 200,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partial = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data:"));

        for (let line of lines) {
          if (line.trim() === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.replace("data: ", ""));
            const token = json.choices?.[0]?.delta?.content || "";
            partial += token;

           
            const limited = partial.split("\n").slice(0, 5).join("\n");

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: limited };
              return updated;
            });
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      
      {!open && (
        <div className="bot-launcher" onClick={() => setOpen(true)}>
          <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="bot" />
          <span>MedBot</span>
        </div>
      )}

   
      {open && (
        <div className="chatbot-container">
          <div className="chat-header">
            <span>💊 MedBot</span>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>

          <div className="chatbox">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <span>{msg.content}</span>
              </div>
            ))}
            {loading && <div className="msg assistant">⏳ Thinking...</div>}
          </div>

        
          <div className="predefined-questions">
            {predefinedQuestions.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} disabled={loading}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="input-box">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medicine..."
            />
            <button onClick={() => sendMessage()} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
