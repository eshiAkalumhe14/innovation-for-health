from llama_cpp import Llama
import os
import gdown

def download_model_if_missing(filename, drive_id, dest_folder="models"):
    os.makedirs(dest_folder, exist_ok=True)
    filepath = os.path.join(dest_folder, filename)

    if not os.path.exists(filepath):

        url = f"https://drive.google.com/uc?id={drive_id}"
        gdown.download(url, output=filepath, quiet=False)
    else:
        print(f"✅ Model already exists at {filepath}")

    return filepath

# Example for Zephyr


zephyr_id = os.getenv("ZEPHYR_DRIVE_ID")
model_path = download_model_if_missing("zephyr-7b-beta.Q4_K_M.gguf", zephyr_id)

llm = Llama(
    model_path=model_path,
    n_ctx=2048,
    verbose=True
)

# Dummy in-memory boost table (not used since Zephyr doesn't retrieve context)
feedback_boost_log = []

# Feedback processing for Zephyr
def update_zephyr_feedback_boost(message, rating):
    feedback_boost_log.append({
        "message": message,
        "rating": rating
    })
    print(f" Zephyr feedback recorded → {rating} on: '{message}'")


def zephyr_response(query):
    prompt = (
        "You are SafeSpaceAI, a warm, inclusive, and trauma-informed virtual support companion. "
        "Your role is to gently guide and support individuals navigating mental health, sexual health, or gender-based violence experiences. "
        "Respond with empathy, kindness, and respect, always validating the person's feelings without judgment. "
        "Be culturally aware, inclusive of all identities and races, and sensitive to different lived experiences. "
        "Speak clearly, calmly, and with emotional intelligence. "
        "Avoid repeating the user's words, and do not label them or their experience. "
        "Keep responses brief for simple messages, and offer thoughtful encouragement for more complex or emotional ones. "
        "Don't make use of emojis"
        "Avoid using labels like 'User:' or 'Assistant:'.\n\n"
        f"Message: {query}\n"
        "Response:"
    )

    response = llm(
        prompt=prompt,
        max_tokens=200,
        temperature=0.6,
        stop=["Message:", "Context:", "###"]
    )

    return response["choices"][0]["text"].strip()
