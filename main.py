import os
import dotenv
dotenv.load_dotenv()
# api_key = os.getenv("MOONSHOT_API_KEY")
# from openai import OpenAI
#
# client = OpenAI(
#     api_key = api_key,
#     base_url = "https://api.moonshot.ai/v1",
# )
#
# completion = client.chat.completions.create(
#     model = "kimi-k2.5",
#     messages = [
#         {"role": "system", "content": "You are Kimi, an AI assistant provided by Moonshot AI. You provide helpful, safe, and accurate answers. 'Moonshot AI' must always remain in English and must not be translated to other languages."},
#         {"role": "user", "content": "Hello, my name is Li Lei. What is 1+1?"}
#     ],
#     temperature = 0.6, # controls randomness of output
#     # max_tokens=32000, # maximum output tokens
# )

# print(completion.choices[0].message.content)


api_key = os.getenv("CEREBRAS_API_KEY")
from cerebras.cloud.sdk import Cerebras

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
