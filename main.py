from django.conf import settings
from cerebras.cloud.sdk import Cerebras

api_key = settings.CEREBRAS_API_KEY
client = Cerebras(api_key=api_key)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Why is fast inference important?",
        }
    ],
    model="llama-3.1-8b",
)

print(chat_completion.choices[0].message.content)
