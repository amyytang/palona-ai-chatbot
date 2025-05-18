import React, { useState, useRef } from 'react';

function ChatBox() {
  const [messages, setMessages] = useState([
    { sender: 'bot',
      text: 'Hi! My name is Palona, your friendly AI e-commerce chatbot. Search for a product in the text box or upload an image, ' +
      'and I will help you find the best products. What can I help you find today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const isGreeting = /^hi$|^hello$|^hey$/i.test(input.trim());
    const isHowAreYou = input.toLowerCase().includes("how are you");

    if (isGreeting) {
      setMessages([...updatedMessages, {
        sender: 'bot',
        text: "Hi there! I'm Palona, your personal shopping assistant. What can I help you find today?",
        type: 'chat'
      }]);
      setLoading(false);
      return;
    }

    if (isHowAreYou) {
      setMessages([...updatedMessages, {
        sender: 'bot',
        text: "I'm great, thank you! How can I help you shop today?",
        type: 'chat'
      }]);
      setLoading(false);
      return;
    }

    try {
      const intentRes = await fetch("http://localhost:8000/classify-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const intentData = await intentRes.json();
      const isProductQuery = intentData.is_product;
      //const isProductQuery = false;
      if (isProductQuery) {
        const res = await fetch("http://localhost:8000/search-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input })
        });

        const data = await res.json();

        if (data.results) {
          const formatted = data.results.map(
            (p) =>
              `${p.title} — ${p.price} [<a href="${p.link}" target="_blank" rel="noopener noreferrer">View Product</a>]`
          ).join("\n\n");

          setMessages([...updatedMessages, { sender: 'bot', text: 'Here are the products I recommend: \n \n' + formatted, type: 'product' }]);
        } else {
          setMessages([...updatedMessages, { sender: 'bot', text: "Sorry, I couldn't find anything relevant.", type: "product" }]);
        }

      } else {
        const res = await fetch("http://localhost:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input })
        });

        const data = await res.json();
        const botReply = data.response || "Sorry, I had trouble processing that.";

        setMessages([...updatedMessages, { sender: 'bot', text: botReply, type: 'chat' }]);
      }

    } catch (err) {
      setMessages([...messages, { sender: 'bot', text: "Something went wrong.", type: 'chat' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const imageUrl = URL.createObjectURL(file);
    const updatedMessages = [...messages, { sender: 'user', type: 'image', image: imageUrl }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/image-search", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      const botMsg = {
        sender: 'bot',
        text: `🧠 I see: "${data.caption}". Here's what I found.`,
        type: 'chat'
      };

      const results = (data.results || []).map(p => ({
        sender: 'bot',
        text: `${p.title} — ${p.price} [<a href="${p.link}" target="_blank" rel="noopener noreferrer">View Product</a>]`,
        type: 'product'
      }));

      setMessages([...updatedMessages, botMsg, ...results]);
    } catch (err) {
      setMessages([...updatedMessages, {
        sender: 'bot',
        text: "Sorry, I couldn't analyze the image.",
        type: 'chat'
      }]);
    } finally {
      setLoading(false);
    }
    e.target.value = null;
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ height: '250px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid #ccc', padding: '0.5rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '0.5rem 0' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: msg.sender === 'user' ? '#d1e7dd' : '#f0f0f0',
              padding: '0.5rem 1rem',
              borderRadius: '15px',
              maxWidth: '80%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}> 
              {msg.type === 'product' ? (
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : msg.type === 'image' ? (
                <img src={msg.image} alt="Uploaded" style={{ maxWidth: '200px', borderRadius: '8px' }} />
              ) : (
                <span>{msg.text}</span>
              )}
            </span>
          </div>
        ))}
        {loading && <div style={{ fontStyle: 'italic', color: '#666' }}>Bot is thinking...</div>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSend} style={{ padding: '0.5rem 1rem' }}>Send</button>
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '0.5rem 1rem' }}>Upload Image 📷</button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default ChatBox;
