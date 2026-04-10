from flask import Flask, render_template, request, jsonify
from groq import Groq
import json

app = Flask(__name__)

# ✅ PASTE YOUR GROQ API KEY HERE
API_KEY = "YOUR_APi"
# Example: API_KEY = "gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

client = Groq(api_key=API_KEY)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    statement = data.get("statement", "").strip()

    if not statement:
        return jsonify({"error": "No statement provided"}), 400
    if len(statement) > 500:
        return jsonify({"error": "Statement too long (max 500 characters)"}), 400

    prompt = f"""You are a fact-checking AI. Analyze the statement below and return ONLY a valid JSON object — no markdown, no extra text, nothing outside the JSON.

Statement: "{statement}"

Return exactly this JSON:
{{
  "truthProbability": <integer 0-100>,
  "verdict": "<TRUE|FALSE|UNCERTAIN>",
  "explanation": "<2-3 clear sentences explaining the analysis>",
  "signals": {{
    "factualAccuracy": <integer 0-100>,
    "sourceReliability": <integer 0-100>,
    "logicalConsistency": <integer 0-100>,
    "scientificConsensus": <integer 0-100>
  }},
  "keyFacts": ["<fact1>", "<fact2>", "<fact3>"]
}}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Free, fast & accurate Groq model
            messages=[
                {
                    "role": "system",
                    "content": "You are a fact-checking AI. Always respond with valid JSON only. No markdown, no extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1000
        )

        raw = completion.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)

        # Sanitize values
        result["truthProbability"] = max(0, min(100, int(result.get("truthProbability", 50))))
        for key in result.get("signals", {}):
            result["signals"][key] = max(0, min(100, int(result["signals"][key])))

        return jsonify(result)

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)