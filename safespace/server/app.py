from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from RAG_handler import mistral_rag_response, update_ranking_with_feedback
from zephyr_model import zephyr_response, update_zephyr_feedback_boost
from llama_model import llama_response, update_llama_feedback
from transformers import pipeline

app = FastAPI()
app.add_middleware(CORSMiddleware, 
                   allow_origins=["*"], 
                   allow_methods=["*"], 
                   allow_headers=["*"])

feedback_store = []


# Load summarization model once at app startup
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")


mistral_keywords = [
    "resource", "resources", "get help", "help center", "support services", "where can I", "find a", "shelter", "safe house", 
    "crisis line", "hotline", "referral", "access care", "who do I call", "legal aid", "counseling", 
    "clinic", "hospital", "emergency room", "sexual health center", "domestic violence shelter", "helpline",
    "gbv response", "rape kit", "safe space", "lawyer", "police report", "report assault", 
    "financial support", "mental health clinic", "health services", "protection order", "restraining order",
    "therapy clinic", "walk-in center", "rape center", "post-rape care", "emergency contraception",
    "sti testing", "hiv support", "abortion access", "safe abortion", "legal rights", "victim services"
]

zephyr_keywords = [
    "mental health", "i feel", "i'm feeling", "anxiety", "depression", "panic", "stressed", "stress", 
    "overwhelmed", "hopeless", "trauma", "cptsd", "ptsd", "lonely", "sad", "cry", "crying", 
    "emotions", "emotionally", "healing", "therapy", "therapist", "therapeutic", "i'm not okay", 
    "how do i cope", "cope", "cope with", "burnout", "self harm", "tired", "grief", "mourning",
    "loss", "heartbreak", "mental breakdown", "inner peace", "mindfulness", "isolation", 
    "mental overload", "breathe", "journaling", "need support", "support me", "talk to someone"
]

llama_keywords = [
    "love", "relationship", "friend", "friendship", "partner", "boyfriend", "girlfriend", "spouse", 
    "dating", "breakup", "make up", "trust", "intimacy", "cheated", "unfaithful", "argue", "arguments", 
    "soulmate", "my crush", "how do I talk to", "talk to them", "mom", "dad", "sister", "brother",
    "my child", "family", "family issues", "parenting", "my partner", "husband", "wife", "feel unloved",
    "i like someone", "relationship problems", "reconnect", "emotional connection", "conflict resolution",
    "being ignored", "communication", "bond", "forgiveness", "how do i forgive", "set boundaries", 
    "healthy relationship", "toxic relationship", "i miss them", "i want them back"
]




# Simple keyword-based mode router
def select_mode(query):
    q = query.lower()

    if any(word in q for word in mistral_keywords):
        return "rag"
    elif any(word in q for word in zephyr_keywords):
        return "zephyr"
    elif any(word in q for word in llama_keywords):
        return "llama"
    else:
        return "zephyr"  # default fallback


@app.post("/chat")
async def chat(request: Request):
    try:
        body = await request.json()
        query = body.get("query", "").strip()
        mode = body.get("mode") or select_mode(query)

        if not query:
            return {"error": "Query cannot be empty."}
        print("Mode:", mode)
        if mode == "zephyr":
            result = zephyr_response(query)
        elif mode == "llama":
            result = llama_response(query)
        elif mode == "rag":
            result = mistral_rag_response(query)
        else:
            return {"error": f"Invalid mode: {mode}. Supported modes are 'zephyr', 'llama', and 'rag'."}

        return {"response": result, "mode_used": mode}

    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}


@app.post("/feedback")
async def feedback(request: Request):
    try:
        data = await request.json()
        session_id = data.get("session_id")
        message = data.get("message")
        rating = data.get("rating")  # "thumbs_up" or "thumbs_down"
        mode = data.get("mode") or select_mode(message)


        print("Mode:", mode)
        if not all([session_id is not None, message, rating]):
            return {"error": "Missing one or more required fields."}

        feedback_store.append({
            "session_id": session_id,
            "message": message,
            "rating": rating,
            "mode": mode
        })

        # Influence future behavior
        if mode == "zephyr":
            update_zephyr_feedback_boost(message, rating)
        elif mode == "rag":
            update_ranking_with_feedback(message, rating)
        elif mode == "llama":
            update_ranking_with_feedback(message, rating)

        print(f"Feedback recorded for '{mode}' → {rating} on: {message}")
        return {"status": "ok", "mode_used": mode}

    except Exception as e:
        return {"error": f"Feedback error: {str(e)}"}
    
@app.post("/summarize")
async def summarize(request: Request):
    data = await request.json()
    text = data.get("text", "")
    if not text:
        return {"summary": "New Chat"}
    
    try:
        summary = summarizer(text, max_length=10, min_length=4, do_sample=False)
        return {"summary": summary[0]["summary_text"]}
    except Exception as e:
        print("Summarization error:", str(e))
        return {"summary": "New Chat"}
