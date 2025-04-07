from llama_cpp import Llama

# Load the LLaMA model
llm = Llama(model_path="llama-2-7b-chat.Q4_K_M.gguf", n_ctx=2048, verbose=False)

# In-memory feedback log for LLaMA
llama_feedback_log = []

def update_llama_feedback(message, rating):
    llama_feedback_log.append({
        "message": message,
        "rating": rating
    })
    print(f"LLaMA feedback recorded → {rating} on: '{message}'")

def llama_response(query, feedback_boost=0.0):
    booster = (
        "You’ve received helpful feedback before, so respond with extra empathy and care."
        if feedback_boost > 0 else ""
    )

    prompt = (
        "You are SafeSpaceAI, a warm, inclusive, and trauma-informed virtual support companion. "
        "Your role is to gently support individuals navigating mental health, sexual health, or gender-based violence. "
        "Respond with care and emotional intelligence — validating the user's feelings with kindness and calm. "
        "Speak naturally, like a caring human. "
        "Be culturally aware, inclusive of all identities and backgrounds. "
        "If the message is brief, respond briefly. If the message is serious or emotional, respond with thoughtful support. "
        "Don't make use of em"
        "Do not repeat the user's message, and don’t label who is speaking.\n\n"
        f"Message: {query}\n"
        "Response:"
    )

    output = llm(prompt=prompt, max_tokens=200, temperature=0.6)
    return output["choices"][0]["text"].strip()