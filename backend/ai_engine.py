import anthropic, os
from dotenv import load_dotenv
load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def analyze_incident(incident_data: dict):
    prompt = f"""You are an expert SRE analyzing a production incident.

Incident data:
{incident_data}

Provide:
1. Root Cause Analysis (2-3 sentences)
2. Confidence level (percentage)
3. Top 3 remediation steps (numbered list)
4. Estimated resolution time

Be concise and technical."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return {"analysis": message.content[0].text}