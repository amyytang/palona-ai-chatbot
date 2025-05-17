# chatbot
# 🛍️ Palona AI: E-Commerce Chat Assistant

Palona is a conversational AI assistant designed for modern e-commerce websites. It supports natural conversation, text-based product recommendations, and image-based product search using AI-generated captions.

---

## ✨ Features

- 💬 General chat (e.g. "What's your name?", "What can you do?")
- 🔍 Product recommendations from SerpAPI via Google Shopping
- 🖼️ Image-based product search using Salesforce BLIP (image → caption → search)
- ⚡ Real-time frontend interface using React
- 🔧 FastAPI backend with modular, documented endpoints

---

## 🖼️ Demo Flow

1. User chats or uploads an image
2. Backend classifies intent (chat vs. product query)
3. Chat goes to an LLM (`Mixtral` via Hugging Face)
4. Product queries hit SerpAPI
5. Image uploads are captioned with BLIP and then searched as text

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React (Vite) + HTML/CSS                 |
| Backend     | FastAPI (Python)                        |
| LLM         | `mistralai/Mixtral-8x7B-Instruct-v0.1`  |
| Image Model | `Salesforce/blip-image-captioning-base`|
| Product API | SerpAPI (Google Shopping)               |
| Hosting     | Local (or Deploy via Render / Vercel)   |

---

## 📁 Project Structure

palona-ai-chatbot/
├── backend/
│ ├── main.py # FastAPI app
| |── requirements.txt # Dependencies
├── frontend/
│ ├── src/components/ChatBox.jsx # Chat UI with image upload
│ └── ... # Vite/React app setup
└── README.md


---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/amyytang/palona-ai-chatbot.git
cd palona-ai-chatbot
```

### 2. Set up the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

```
Get your own keys and put them in chatbot/backend/.env
```bash
HF_TOKEN= [INSERT YOUR TOKEN HERE]
SERPAPI_KEY= [INSERT YOUR SERPAPI_KEY HERE]
```
Then run,
```bash
uvicorn main:app --reload
```
### 3. Set up the Frontend
```bash
cd frontend
npm install
npm run dev

```
## 🧠 API Endpoints

| Endpoint            | Method | Description                           |
|---------------------|--------|---------------------------------------|
| `/chat`             | POST   | Handles general user questions        |
| `/classify-intent`  | POST   | Classifies whether message is about shopping |
| `/search-products`  | POST   | Returns product matches from SerpAPI  |
| `/image-search`     | POST   | Generates caption from image and finds product matches |

## 🖼️ How Image Search Works

1. User uploads an image via the chatbot
2. The image is sent to the `/image-search` endpoint
3. The backend uses [Salesforce BLIP](https://huggingface.co/Salesforce/blip-image-captioning-base) to generate a caption
4. That caption is used to perform a Google Shopping query via SerpAPI
5. The top 3 matching products are returned to the user

Works with both JPG and PNG.

## 💬 Sample Interaction

**User:** `how are you`  
**Bot:** `I'm great, thank you! How can I help you shop today?`

**User:** `headphones under $100`  
**Bot:**  
Soundcore by Anker Q20i Active Noise Cancelling Headphones — $44.99 [<a href="https://www.google.com/shopping/product/15650450647653032436?gl=us" target="_blank"><u>View Product</u></a>]  
JBL On-Ear Headphones Tune 520BT Wireless — $39.95 [<a href="https://www.google.com/shopping/product/1652652966213390992?gl=us" target="_blank"><u>View Product</u></a>]  
Anker Soundcore Space One Wireless Noise Cancelling Headphones — $99.99 [<a href="https://www.google.com/shopping/product/2603543617841055287?gl=us" target="_blank"><u>View Product</u></a>]

**User:** *(uploads image of blue sneakers)*  
**Bot:**  
🧠 I see: `"a pair of blue running shoes"`  
On Women's Cloud 5 — $110.00 [<a href="https://www.google.com/shopping/product/16291363849044822863?gl=us" target="_blank"><u>View Product</u></a>]
Nike Men's Revolution 7 Running Shoes — $48.97 [<a href="https://www.google.com/shopping/product/3332658191799895157?gl=us" target="_blank"><u>View Product</u></a>]
Under Armour Men's Charged Assert 10 Running Shoes — $54.95 [<a href="https://www.google.com/shopping/product/921836573638826032?gl=us" target="_blank"><u>View Product</u></a>]

## 🛠️ Development Notes

- The backend runs at `http://localhost:8000`
- The frontend runs at `http://localhost:5173` (Vite default)
- FastAPI's Swagger docs are available at: `http://localhost:8000/docs`
- If you see `ERR_CONNECTION_REFUSED`, make sure the backend is running
- Environment variables like `HF_TOKEN` and `SERPAPI_KEY` must be in a `.env` file in `/backend`

## 🧠 Design Decisions

- **Intent Classification**  
  I added an `/classify-intent` endpoint to distinguish between general chat and product-related queries. This helps route messages efficiently (e.g., "how are you" vs "show me shoes under $50"). Images automatically use product-related queries and do not go throug /classify-intent

- **Image-to-Product Search with BLIP**  
  Instead of training a custom vision model, I used Salesforce's BLIP via Hugging Face to generate image captions. This let me integrate image-based product search quickly and accurately without building my own embedding pipeline.

- **Product Search with SerpAPI**  
  I used SerpAPI to get real, relevant, and up-to-date products with accurate prices and real links.

- **Separate Frontend and Backend**  
  The project uses Vite (React) for the frontend and FastAPI for the backend. This separation made it easier to manage model code and UI independently. Separation of concerns enables me to evolve frontend and backend independently in case I want to make significant changes to one but not the other.
  
  I chose to use React because React is one of the most popular front-end technologies, is easy to learn and has effective built in libraries. My goal is to set up the front end easily, so I can focus on the AI search features. I chose to use FastAPI because it is an easy-to-use modern web framework that lets me build up the backend efficiently.


## 🔮 Future Improvements

- Can add filtering for image search (e.g. by price or category)

## 📌 License

MIT License — use freely, credit appreciated.


