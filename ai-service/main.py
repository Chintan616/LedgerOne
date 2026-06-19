import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

from agent import run_chat  # noqa: E402 — import after dotenv so env vars are set

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LedgerOne AI Service")


class ChatRequest(BaseModel):
    message: str
    user_email: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    reply, conv_id = run_chat(req.message, req.user_email, req.conversation_id)
    return ChatResponse(reply=reply, conversation_id=conv_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8001")), reload=False)
