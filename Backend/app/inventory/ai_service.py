import os
from google import genai
from google.genai import types

def ask_nexus_ai(user_role, user_prompt, context_data):
    # Initialize client securely using environment variables
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    system_instruction = (
        f"You are Nexus AI, an enterprise ERP inventory management assistant. "
        f"The user interacting with you has the role: {user_role}. "
        f"CRITICAL FORMATTING RULE: Whenever a user asks for inventory health, low stock, or status reports, you MUST format your response using: "
        f"1. A brief Status Overview list with counts. "
        f"2. A Markdown Table with columns: SKU, Product Description, Location, Total Stock, Priority, and Status / Exception Reason. "
        f"3. A numbered list of Recommended System Actions. "
        f"Never use nested bullets for inventory lists when a table can be used. "
        f"Here is the current state of the inventory:\n{context_data}"
    )
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',  # ✅ Valid model name
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            ),
        )
        
        return response.text
    except Exception as e:
        raise RuntimeError(f"Gemini API Communication Failure: {str(e)}")