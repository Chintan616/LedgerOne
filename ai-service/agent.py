import os
import uuid
import json
import logging
import datetime

from sqlalchemy import create_engine, text
from pydantic import BaseModel, Field

from langchain_openai import ChatOpenAI
from langchain_core.tools import StructuredTool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

logger = logging.getLogger(__name__)

# ── Database ──────────────────────────────────────────────────────────────────

_engine = None

def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(os.environ["POSTGRES_URL"], pool_pre_ping=True)
    return _engine

def _q(sql: str, params: dict) -> str:
    with _get_engine().connect() as conn:
        rows = conn.execute(text(sql), params)
        return json.dumps([dict(r._mapping) for r in rows], default=str)

# ── Date helper ───────────────────────────────────────────────────────────────

def _date_clause(period: str, col: str) -> tuple[str, dict]:
    today = datetime.date.today()
    if period == "this_month":
        return f"AND {col} >= :p_start", {"p_start": today.replace(day=1)}
    if period == "this_year":
        return f"AND {col} >= :p_start", {"p_start": today.replace(month=1, day=1)}
    return "", {}

# ── Query functions ───────────────────────────────────────────────────────────

def _find_client(user_email: str, name: str) -> str:
    return _q(
        """SELECT name, company_name, email, phone, gstin, address
           FROM clients
           WHERE user_email = :ue AND name ILIKE :n
           ORDER BY name LIMIT 10""",
        {"ue": user_email, "n": f"%{name}%"},
    )

def _get_invoices(user_email: str, status: str = "all",
                  client_name: str | None = None, period: str = "all") -> str:
    conds = ["i.user_email = :ue"]
    params: dict = {"ue": user_email}
    if status != "all":
        conds.append("i.status = :status")
        params["status"] = status.upper()
    if client_name:
        conds.append("c.name ILIKE :cn")
        params["cn"] = f"%{client_name}%"
    clause, dp = _date_clause(period, "i.issue_date")
    if clause:
        conds.append(clause.removeprefix("AND "))
        params.update(dp)
    return _q(
        f"""SELECT i.invoice_number, c.name AS client, i.issue_date,
                   i.due_date, i.status, i.total_amount
            FROM invoices i JOIN clients c ON i.client_id = c.id
            WHERE {" AND ".join(conds)}
            ORDER BY i.issue_date DESC LIMIT 25""",
        params,
    )

def _get_financial_summary(user_email: str, period: str = "all") -> str:
    inv_clause, inv_dp = _date_clause(period, "issue_date")
    exp_clause, exp_dp = _date_clause(period, "date")
    inv_rows = json.loads(_q(
        f"SELECT status, COALESCE(SUM(total_amount), 0) AS total FROM invoices "
        f"WHERE user_email = :ue {inv_clause} GROUP BY status",
        {"ue": user_email, **inv_dp},
    ))
    exp_row = json.loads(_q(
        f"SELECT COALESCE(SUM(amount), 0) AS total FROM expenses "
        f"WHERE user_email = :ue {exp_clause}",
        {"ue": user_email, **exp_dp},
    ))
    out = {"revenue": 0.0, "pending": 0.0, "overdue": 0.0, "expenses": 0.0}
    for r in inv_rows:
        if r["status"] == "PAID":    out["revenue"] = float(r["total"])
        elif r["status"] == "SENT":  out["pending"] = float(r["total"])
        elif r["status"] == "OVERDUE": out["overdue"] = float(r["total"])
    out["expenses"] = float(exp_row[0]["total"])
    out["profit"] = out["revenue"] - out["expenses"]
    return json.dumps(out)

def _get_expense_summary(user_email: str, period: str = "all") -> str:
    clause, dp = _date_clause(period, "date")
    return _q(
        f"SELECT category, SUM(amount) AS total, COUNT(*) AS count "
        f"FROM expenses WHERE user_email = :ue {clause} "
        f"GROUP BY category ORDER BY total DESC",
        {"ue": user_email, **dp},
    )

def _get_top_clients(user_email: str, n: int = 5, period: str = "all") -> str:
    clause, dp = _date_clause(period, "i.issue_date")
    return _q(
        f"""SELECT c.name, c.company_name, COUNT(i.id) AS invoices,
                   COALESCE(SUM(CASE WHEN i.status='PAID' THEN i.total_amount END), 0) AS paid,
                   COALESCE(SUM(CASE WHEN i.status IN ('SENT','OVERDUE') THEN i.total_amount END), 0) AS pending
            FROM clients c JOIN invoices i ON i.client_id = c.id
            WHERE i.user_email = :ue {clause}
            GROUP BY c.id, c.name, c.company_name
            ORDER BY paid DESC LIMIT :n""",
        {"ue": user_email, "n": n, **dp},
    )

def _get_overdue_invoices(user_email: str) -> str:
    return _q(
        """SELECT i.invoice_number, c.name AS client, c.email AS client_email,
                  i.due_date, i.total_amount, (CURRENT_DATE - i.due_date) AS days_overdue
           FROM invoices i JOIN clients c ON i.client_id = c.id
           WHERE i.user_email = :ue AND i.status = 'OVERDUE'
           ORDER BY days_overdue DESC""",
        {"ue": user_email},
    )

def _get_monthly_breakdown(user_email: str, year: int | None = None) -> str:
    y = year or datetime.date.today().year
    revenue = json.loads(_q(
        """SELECT EXTRACT(MONTH FROM issue_date)::int AS month,
                  TO_CHAR(issue_date, 'Mon') AS label, SUM(total_amount) AS amount
           FROM invoices WHERE user_email = :ue AND status = 'PAID'
             AND EXTRACT(YEAR FROM issue_date) = :y
           GROUP BY 1, 2 ORDER BY 1""",
        {"ue": user_email, "y": y},
    ))
    expenses = json.loads(_q(
        """SELECT EXTRACT(MONTH FROM date)::int AS month,
                  TO_CHAR(date, 'Mon') AS label, SUM(amount) AS amount
           FROM expenses WHERE user_email = :ue AND EXTRACT(YEAR FROM date) = :y
           GROUP BY 1, 2 ORDER BY 1""",
        {"ue": user_email, "y": y},
    ))
    return json.dumps({"year": y, "revenue_by_month": revenue, "expenses_by_month": expenses})

# ── Pydantic input schemas ────────────────────────────────────────────────────

class FindClientInput(BaseModel):
    name: str = Field(description="Partial or full client name to search for")

class GetInvoicesInput(BaseModel):
    status: str = Field(default="all", description="Invoice status: all, DRAFT, SENT, PAID, OVERDUE")
    client_name: str | None = Field(default=None, description="Optional partial client name filter")
    period: str = Field(default="all", description="Time period: all, this_month, this_year")

class PeriodInput(BaseModel):
    period: str = Field(default="all", description="Time period: all, this_month, this_year")

class TopClientsInput(BaseModel):
    n: int = Field(default=5, description="Number of top clients to return")
    period: str = Field(default="all", description="Time period: all, this_month, this_year")

class MonthlyBreakdownInput(BaseModel):
    year: int | None = Field(default=None, description="Year — defaults to current year")

class EmptyInput(BaseModel):
    pass

# ── Build LangChain StructuredTools bound to a specific user ──────────────────

def _make_tools(user_email: str) -> list[StructuredTool]:
    def find_client(name: str) -> str:
        return _find_client(user_email, name)

    def get_invoices(status: str = "all", client_name: str | None = None, period: str = "all") -> str:
        return _get_invoices(user_email, status, client_name, period)

    def get_financial_summary(period: str = "all") -> str:
        return _get_financial_summary(user_email, period)

    def get_expense_summary(period: str = "all") -> str:
        return _get_expense_summary(user_email, period)

    def get_top_clients(n: int = 5, period: str = "all") -> str:
        return _get_top_clients(user_email, n, period)

    def get_overdue_invoices() -> str:
        return _get_overdue_invoices(user_email)

    def get_monthly_breakdown(year: int | None = None) -> str:
        return _get_monthly_breakdown(user_email, year)

    return [
        StructuredTool.from_function(
            name="find_client",
            description="Find a client by name (fuzzy/partial match). Use for any question about a specific client: GST number, email, phone, address.",
            func=find_client,
            args_schema=FindClientInput,
        ),
        StructuredTool.from_function(
            name="get_invoices",
            description="Get invoices filtered by status, client name, or time period.",
            func=get_invoices,
            args_schema=GetInvoicesInput,
        ),
        StructuredTool.from_function(
            name="get_financial_summary",
            description="Get financial overview: total revenue, expenses, net profit, pending and overdue amounts.",
            func=get_financial_summary,
            args_schema=PeriodInput,
        ),
        StructuredTool.from_function(
            name="get_expense_summary",
            description="Get total expenses grouped by category (Rent, Internet, Travel, etc.).",
            func=get_expense_summary,
            args_schema=PeriodInput,
        ),
        StructuredTool.from_function(
            name="get_top_clients",
            description="Get top N clients ranked by paid invoice revenue.",
            func=get_top_clients,
            args_schema=TopClientsInput,
        ),
        StructuredTool.from_function(
            name="get_overdue_invoices",
            description="Get all overdue invoices with client contact info and days overdue.",
            func=get_overdue_invoices,
            args_schema=EmptyInput,
        ),
        StructuredTool.from_function(
            name="get_monthly_breakdown",
            description="Get month-by-month revenue and expense breakdown for a given year.",
            func=get_monthly_breakdown,
            args_schema=MonthlyBreakdownInput,
        ),
    ]

# ── LLM singleton ─────────────────────────────────────────────────────────────

_llm: ChatOpenAI | None = None

_SYSTEM = (
    "You are a financial assistant for LedgerOne, a cloud invoicing and accounting platform. "
    "Always use the provided tools to fetch data — never guess or invent numbers. "
    "Format all currency as ₹X,XXX. Be concise and friendly."
)

def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not set")
        logger.info("Initialising LLM, key prefix: %s", api_key[:12])
        os.environ["OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        _llm = ChatOpenAI(
            model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            temperature=0,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
        )
    return _llm

# ── Conversation store ────────────────────────────────────────────────────────

_conversations: dict[str, list] = {}

# ── Entry point ───────────────────────────────────────────────────────────────

def run_chat(message: str, user_email: str, conversation_id: str | None) -> tuple[str, str]:
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    history = _conversations.get(conversation_id, [])
    tools = _make_tools(user_email)

    # bind_tools tells LangChain's ChatOpenAI to send tool schemas in the
    # OpenAI function-calling format — the LLM picks the right tool + args
    llm_with_tools = _get_llm().bind_tools(tools)
    tool_map = {t.name: t for t in tools}

    # Build LangChain message list
    messages: list = [SystemMessage(content=_SYSTEM)]
    messages.extend(history[-6:])  # last 3 user/assistant pairs
    messages.append(HumanMessage(content=message))

    reply = "I couldn't process that request. Please try again."

    for _ in range(5):  # max 5 tool-call iterations per turn
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            reply = response.content or reply
            break

        # Execute each tool LangChain selected and feed results back
        for tc in response.tool_calls:
            try:
                result = tool_map[tc["name"]].invoke(tc["args"])
            except Exception as exc:
                logger.error("Tool %s failed: %s", tc["name"], exc)
                result = json.dumps({"error": str(exc)})
            messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))

    # Persist only the user/assistant pair to history
    _conversations[conversation_id] = (
        history + [HumanMessage(content=message), AIMessage(content=reply)]
    )[-10:]

    return reply, conversation_id
