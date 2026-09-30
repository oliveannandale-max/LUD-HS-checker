/**
 * LUD Logistics - Direct Browser Gemini 2.5 Flash Client
 * Handles Google AI Studio API calls directly in the browser for GitHub Pages.
 */

class BrowserGeminiClient {
  constructor() {
    this.model = "gemini-2.5-flash";
    this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models";
    this.minIntervalMs = 4200; // 4.2s delay enforces safe < 14.3 RPM
    this.lastCallTime = 0;
  }

  getApiKey() {
    const keyInput = document.getElementById('geminiApiKey');
    const inputVal = keyInput ? keyInput.value.trim() : '';
    if (inputVal) return inputVal;
    return localStorage.getItem('lud_gemini_api_key') || '';
  }

  saveApiKey(key) {
    if (key) {
      localStorage.setItem('lud_gemini_api_key', key);
    }
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      const wait = this.minIntervalMs - elapsed;
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    this.lastCallTime = Date.now();
  }

  async callGemini(prompt, systemInstruction, imageBase64 = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key provided. Using local WCO rules engine fallback.");
    }

    await this.throttle();

    const parts = [];
    if (imageBase64) {
      const parts_raw = imageBase64.split(',');
      const mime = parts_raw[0].split(';')[0].replace('data:', '');
      const b64 = parts_raw[1];
      parts.push({
        inline_data: {
          mime_type: mime,
          data: b64
        }
      });
    }

    parts.push({ text: prompt });

    const payload = {
      contents: [{ role: "user", parts: parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const url = `${this.endpoint}/${this.model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google AI Studio HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let clean = rawText.trim();
    if (clean.startsWith("```json")) clean = clean.slice(7);
    else if (clean.startsWith("```")) clean = clean.slice(3);
    if (clean.endsWith("```")) clean = clean.slice(0, -3);

    return JSON.parse(clean.trim());
  }
}

window.BrowserGemini = new BrowserGeminiClient();
