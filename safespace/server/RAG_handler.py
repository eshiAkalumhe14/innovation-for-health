from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from sentence_transformers import SentenceTransformer
import faiss, os
import requests

# Setup Hugging Face Inference API
HUGGINGFACE_API_URL = "https://pwonlon89submws5.us-east-1.aws.endpoints.huggingface.cloud"
token = "DUMMY_TOKEN"  # Replace with actual token
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Data directory
data_dir = os.path.join(".", "data")

# Load documents from .txt files
docs = [open(os.path.join(data_dir, f), "r", encoding="utf-8").read()
        for f in os.listdir(data_dir) if f.endswith(".txt")]

# Initialize embedder and build FAISS index
embedder = SentenceTransformer("all-MiniLM-L6-v2")
doc_embeddings = embedder.encode(docs)
index = faiss.IndexFlatL2(doc_embeddings[0].shape[0])
index.add(doc_embeddings)

# Feedback-influenced boost map
feedback_boosts = {}  # {doc_index: boost_weight}

def retrieve_context(query, k=3):
    query_vec = embedder.encode([query])
    distances, indices = index.search(query_vec, k + len(feedback_boosts))

    ranked_docs = []
    for dist, i in zip(distances[0], indices[0]):
        boost = feedback_boosts.get(i, 1.0)
        score = dist / boost  # lower distance is better, so divide by boost
        ranked_docs.append((score, docs[i]))

    ranked_docs.sort(key=lambda x: x[0])
    return [doc for _, doc in ranked_docs[:k]]

def mistral_rag_response(query):
    context = "\n\n".join(retrieve_context(query))

    prompt = (
        "You are SafeSpaceAI, a warm, inclusive, and trauma-informed virtual support companion. "
        "Your role is to gently guide and support individuals navigating mental health, sexual health, or gender-based violence experiences. "
        "Respond with empathy, kindness, and respect, always validating the person's feelings without judgment. "
        "Be culturally aware, inclusive of all identities and races, and sensitive to different lived experiences. "
        "Speak clearly, calmly, and with emotional intelligence. "
        "You are given helpful reference materials below. Use them to inform your response, "
        "but also draw on your own reasoning and knowledge to provide the best answer. "
        "Correlate insights from the context with what you know. "
        "Respond based only on the user's message without repeating it. "
        "Keep responses brief for simple messages, and thoughtful for complex ones. "
        "Don't make use of emojis"
        "Avoid using 'User:', 'You:' or 'Assistant:' in your reply.\n\n"
        f"Context:\n{context}\n\n"
        f"Message: {query}\n"
        "Response:"
    )


    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 300,
            "temperature": 0.5,
            "top_p": 0.85,
            "repetition_penalty": 1.3,
            "stop": ["User:", "You:", "Reply:", "Message:"],
            "return_full_text": False
        }
    }

    response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=payload)

    try:
        return response.json()[0]["generated_text"]
    except (KeyError, IndexError):
        return "I'm sorry, something went wrong while processing your request."

def update_ranking_with_feedback(message, rating):
    query_vec = embedder.encode([message])
    _, indices = index.search(query_vec, 1)
    doc_id = indices[0][0]

    # Adjust boost weights
    current = feedback_boosts.get(doc_id, 1.0)
    if rating == "thumbs_up":
        feedback_boosts[doc_id] = min(current + 0.2, 3.0)
    elif rating == "thumbs_down":
        feedback_boosts[doc_id] = max(current - 0.2, 0.5)  