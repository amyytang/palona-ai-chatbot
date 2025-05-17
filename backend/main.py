from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
import uvicorn
import os
import requests


# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = """Your name is Palona, a friendly, concise AI shopping assistant built for a modern e-commerce site. 
    If the user asks you what is your name, say 'My name is Palona.'
    Please do not tell jokes unless asked to tell jokes.
    If the prompt is not related to e-commerce, say that you are made specifically for e-commerce.
    Avoid philosophical or off topic replies"""
    # system_prompt = ""

    user_input = f"User: {request.message}\nPalona:"

    data = {
        "inputs": f"{system_prompt}\n{user_input}",
        "parameters": {
            "max_new_tokens": 200,
            "do_sample": True,
            "temperature": 0.7
        }
    }

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}"
    }

    try:
        response = requests.post(
            "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and "generated_text" in result[0]:
            # Only return the bot's reply (hide the system prompt and user message)
            reply = result[0]["generated_text"].split("Palona:")[-1].strip()
            return {"response": reply}
        else:
            return {"error": "Unexpected model response format."}

    except Exception as e:
        return {"error": str(e)}
    
import urllib.parse

class RecommendRequest(BaseModel):
    message: str

@app.post("/search-products")
async def search_products(request: RecommendRequest):
    query = urllib.parse.quote(request.message)
    api_key = os.getenv("SERPAPI_KEY")

    serp_url = f"https://serpapi.com/search.json?engine=google_shopping&q={query}&api_key={api_key}"

    try:
        res = requests.get(serp_url)
        res.raise_for_status()
        results = res.json().get("shopping_results", [])
        top_results = [
            {
                "title": r.get("title"),
                "price": r.get("price"),
                "link": r.get("product_link"),
                "source": r.get("source")
            }
            for r in results[:3]  # top 3
        ]
        return {"results": top_results}

    except Exception as e:
        return {"error": str(e)}
    
class IntentRequest(BaseModel):
    message: str
    
@app.post("/classify-intent")
async def classify_intent(request: IntentRequest):
    system_prompt = (
        "You are a classifier AI. Your job is to decide whether a user's message is about shopping for a product "
        "(such as asking for recommendations, comparing items, or browsing options). Respond ONLY with YES or NO.\n\n"
        f"User: {request.message}\nAnswer:"
    )

    data = {
        "inputs": system_prompt,
        "parameters": {
            "max_new_tokens": 3,
            "temperature": 0.1
        }
    }

    headers = {
        "Authorization": f"Bearer {os.getenv('HF_TOKEN')}"
    }

    try:
        response = requests.post(
        "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
        headers=headers,
        json=data
        )
        result = response.json()

        full_output = result[0]["generated_text"]
        answer_line = full_output.split("Answer:")[-1].strip().upper()

        is_product = "YES" in answer_line
        return {"is_product": is_product}


    except Exception as e:
        return {"is_product": False, "error": str(e)}
    
from fastapi import UploadFile, File

# Load BLIP model (load once at startup)
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

@app.post("/image-search")
async def image_search(file: UploadFile = File(...)):
    try:
        image = Image.open(BytesIO(await file.read())).convert("RGB")
        inputs = blip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            output = blip_model.generate(**inputs)
        caption = blip_processor.decode(output[0], skip_special_tokens=True)

        # Optional: Use caption to search products via /search-products
        query = urllib.parse.quote(caption)
        api_key = os.getenv("SERPAPI_KEY")
        serp_url = f"https://serpapi.com/search.json?engine=google_shopping&q={query}&api_key={api_key}"

        res = requests.get(serp_url)
        res.raise_for_status()
        results = res.json().get("shopping_results", [])
        top_results = [
            {
                "title": r.get("title"),
                "price": r.get("price"),
                "link": r.get("product_link"),
                "source": r.get("source")
            }
            for r in results[:3]
        ]

        return {"caption": caption, "results": top_results}

    except Exception as e:
        return {"error": str(e), "caption": "Unable to process image", "results": []}

        
   