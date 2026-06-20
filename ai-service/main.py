import asyncio
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

from agent import run_chat        # noqa: E402
from embed import embed_incremental  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMBED_INTERVAL_SECONDS = 300  # 5 minutes

async def _auto_embed_loop():
    while True:
        await asyncio.sleep(EMBED_INTERVAL_SECONDS)
        logger.info("Running incremental embed ...")
        try:
            embed_incremental()
        except Exception as exc:
            logger.error("Incremental embed failed: %s", exc)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Seeding embeddings on startup ...")
    try:
        embed_incremental()
    except Exception as exc:
        logger.error("Startup embed failed: %s", exc)
    asyncio.create_task(_auto_embed_loop())
    yield

app = FastAPI(title="LedgerOne AI Service", lifespan=lifespan)


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
