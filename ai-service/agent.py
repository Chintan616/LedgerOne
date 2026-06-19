import os
import uuid
import logging
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

# Module-level singletons — created once, reused across requests
_db: SQLDatabase | None = None
_llm: ChatOpenAI | None = None

# In-memory conversation store: conversation_id -> list of (human, ai) pairs
_conversations: dict[str, list[tuple[str, str]]] = {}

INCLUDED_TABLES = [
    "invoices",
    "clients",
    "expenses",
    "invoice_items",
    "business_profiles",
]


def _get_db() -> SQLDatabase:
    global _db
    if _db is None:
        _db = SQLDatabase.from_uri(
            os.environ["POSTGRES_URL"],
            include_tables=INCLUDED_TABLES,
            sample_rows_in_table_info=2,
        )
    return _db


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            openai_api_key=os.environ["OPENROUTER_API_KEY"],
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0,
            default_headers={
                "HTTP-Referer": "https://ledgerone.app",
                "X-Title": "LedgerOne",
            },
        )
    return _llm


def _build_prefix(user_email: str, history: list[tuple[str, str]]) -> str:
    history_section = ""
    if history:
        turns = "\n".join(f"Human: {h}\nAssistant: {a}" for h, a in history[-3:])
        history_section = f"\nPrevious conversation:\n{turns}\n"

    return f"""You are a financial assistant for LedgerOne, a cloud invoicing and accounting platform.
You help the authenticated user understand their invoices, clients, and expenses by querying their data.

CRITICAL SECURITY RULE: Every single SQL query you write MUST include the filter:
  WHERE user_email = '{user_email}'
Never omit this filter. Never access data belonging to other users.

Database schema:
- invoices(id, user_email, invoice_number, client_id, issue_date, due_date, status, subtotal, gst_rate, gst_amount, total_amount, notes)
  status values: DRAFT, SENT, PAID, OVERDUE
- clients(id, user_email, name, company_name, email, phone, address, gstin)
- expenses(id, user_email, description, amount, category, date)
  category values: Rent, Internet, Marketing, Travel, Software Subscription, Miscellaneous
- invoice_items(id, invoice_id, description, quantity, unit_price, amount)
- business_profiles(id, user_email, business_name, address, gstin, bank_details)
{history_section}
Answer in a friendly, concise way. Format all currency as ₹X,XXX. If no data is found, say so clearly."""


def run_chat(message: str, user_email: str, conversation_id: str | None) -> tuple[str, str]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    history = _conversations.get(conversation_id, [])

    agent_executor = create_sql_agent(
        llm=_get_llm(),
        db=_get_db(),
        prefix=_build_prefix(user_email, history),
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=8,
    )

    try:
        result = agent_executor.invoke({"input": message})
        reply = result["output"]
    except Exception as exc:
        logger.error("Agent error for user %s: %s", user_email, exc)
        reply = "Sorry, I couldn't process that. Please try rephrasing your question."

    updated_history = history + [(message, reply)]
    _conversations[conversation_id] = updated_history[-10:]

    return reply, conversation_id
