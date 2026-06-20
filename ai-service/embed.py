"""
embed.py — Populate pgvector embeddings for invoice items, invoice notes, and expenses.

Run once to seed the table, then re-run whenever new invoices/expenses are added:
    python embed.py

Requires: sentence-transformers, psycopg2-binary, pgvector extension in Postgres.
The pgvector extension must be enabled in your DB:
    CREATE EXTENSION IF NOT EXISTS vector;
"""

import json
import logging
import os

import psycopg2
from dotenv import load_dotenv
from fastembed import TextEmbedding

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MODEL_NAME = "BAAI/bge-small-en-v1.5"
DIMS = 384

_model: TextEmbedding | None = None

def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        logger.info("Loading model '%s' ...", MODEL_NAME)
        _model = TextEmbedding(MODEL_NAME)
    return _model


def _conn():
    url = os.environ["POSTGRES_URL"].replace("postgresql+psycopg2://", "postgresql://")
    return psycopg2.connect(url)


def _setup(cur):
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS invoice_embeddings (
            id          SERIAL PRIMARY KEY,
            user_email  TEXT    NOT NULL,
            source_type TEXT    NOT NULL,
            source_id   BIGINT  NOT NULL,
            content     TEXT    NOT NULL,
            metadata    JSONB,
            embedding   vector({DIMS}) NOT NULL,
            UNIQUE (source_type, source_id)
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ie_user_idx
            ON invoice_embeddings (user_email)
    """)


def _upsert(cur, user_email, source_type, source_id, content, metadata, emb):
    emb_str = "[" + ",".join(f"{v:.6f}" for v in emb) + "]"
    cur.execute("""
        INSERT INTO invoice_embeddings
            (user_email, source_type, source_id, content, metadata, embedding)
        VALUES (%s, %s, %s, %s, %s, %s::vector)
        ON CONFLICT (source_type, source_id) DO UPDATE
            SET content   = EXCLUDED.content,
                metadata  = EXCLUDED.metadata,
                embedding = EXCLUDED.embedding
    """, (user_email, source_type, source_id, content, json.dumps(metadata), emb_str))


def _embed_invoice_items(cur, model):
    cur.execute("""
        SELECT ii.id,
               ii.description,
               ii.quantity,
               ii.amount,
               i.invoice_number,
               i.user_email,
               i.issue_date,
               i.status,
               c.name AS client_name
        FROM   invoice_items ii
        JOIN   invoices i ON ii.invoice_id = i.id
        JOIN   clients  c ON i.client_id   = c.id
    """)
    rows = cur.fetchall()
    if not rows:
        logger.info("No invoice items found.")
        return

    texts = [
        f"Invoice {r[4]} for client {r[8]}: {r[1]} (qty {r[2]}, ₹{r[3]})"
        for r in rows
    ]
    logger.info("Embedding %d invoice items ...", len(rows))
    embeddings = list(model.embed(texts))
    for r, emb, text in zip(rows, embeddings, texts):
        _upsert(cur, r[5], "invoice_item", r[0], text, {
            "invoice_number": r[4],
            "client_name":    r[8],
            "issue_date":     str(r[6]),
            "status":         r[7],
            "amount":         float(r[3]),
        }, emb.tolist())
    logger.info("Done: invoice items.")


def _embed_invoice_notes(cur, model):
    cur.execute("""
        SELECT i.id,
               i.notes,
               i.invoice_number,
               i.user_email,
               i.issue_date,
               i.status,
               i.total_amount,
               c.name AS client_name
        FROM   invoices i
        JOIN   clients  c ON i.client_id = c.id
        WHERE  i.notes IS NOT NULL AND TRIM(i.notes) <> ''
    """)
    rows = cur.fetchall()
    if not rows:
        logger.info("No invoice notes found.")
        return

    texts = [
        f"Invoice {r[2]} for client {r[7]} note: {r[1]}"
        for r in rows
    ]
    logger.info("Embedding %d invoice notes ...", len(rows))
    embeddings = list(model.embed(texts))
    for r, emb, text in zip(rows, embeddings, texts):
        _upsert(cur, r[3], "invoice_note", r[0], text, {
            "invoice_number": r[2],
            "client_name":    r[7],
            "issue_date":     str(r[4]),
            "status":         r[5],
            "total_amount":   float(r[6]) if r[6] else None,
        }, emb.tolist())
    logger.info("Done: invoice notes.")


def _embed_expenses(cur, model):
    cur.execute("""
        SELECT id, description, category, amount, date, user_email
        FROM   expenses
    """)
    rows = cur.fetchall()
    if not rows:
        logger.info("No expenses found.")
        return

    texts = [
        f"Expense ({r[2]}): {r[1]}, ₹{r[3]} on {r[4]}"
        for r in rows
    ]
    logger.info("Embedding %d expenses ...", len(rows))
    embeddings = list(model.embed(texts))
    for r, emb, text in zip(rows, embeddings, texts):
        _upsert(cur, r[5], "expense", r[0], text, {
            "category": r[2],
            "amount":   float(r[3]),
            "date":     str(r[4]),
        }, emb.tolist())
    logger.info("Done: expenses.")


def embed_incremental():
    """Embed only records not yet in invoice_embeddings. Called automatically every 5 min."""
    conn = _conn()
    try:
        with conn.cursor() as cur:
            _setup(cur)

            # --- New invoice items ---
            cur.execute("""
                SELECT ii.id, ii.description, ii.quantity, ii.amount,
                       i.invoice_number, i.user_email, i.issue_date, i.status,
                       c.name AS client_name
                FROM   invoice_items ii
                JOIN   invoices i ON ii.invoice_id = i.id
                JOIN   clients  c ON i.client_id   = c.id
                WHERE  ii.id NOT IN (
                    SELECT source_id FROM invoice_embeddings WHERE source_type = 'invoice_item'
                )
            """)
            rows = cur.fetchall()
            if rows:
                model = _get_model()
                texts = [f"Invoice {r[4]} for client {r[8]}: {r[1]} (qty {r[2]}, ₹{r[3]})" for r in rows]
                for r, emb, text in zip(rows, list(model.embed(texts)), texts):
                    _upsert(cur, r[5], "invoice_item", r[0], text, {
                        "invoice_number": r[4], "client_name": r[8],
                        "issue_date": str(r[6]), "status": r[7], "amount": float(r[3]),
                    }, emb.tolist())
                logger.info("Auto-embedded %d new invoice items.", len(rows))

            # --- New invoice notes ---
            cur.execute("""
                SELECT i.id, i.notes, i.invoice_number, i.user_email,
                       i.issue_date, i.status, i.total_amount, c.name AS client_name
                FROM   invoices i
                JOIN   clients  c ON i.client_id = c.id
                WHERE  i.notes IS NOT NULL AND TRIM(i.notes) <> ''
                  AND  i.id NOT IN (
                    SELECT source_id FROM invoice_embeddings WHERE source_type = 'invoice_note'
                )
            """)
            rows = cur.fetchall()
            if rows:
                model = _get_model()
                texts = [f"Invoice {r[2]} for client {r[7]} note: {r[1]}" for r in rows]
                for r, emb, text in zip(rows, list(model.embed(texts)), texts):
                    _upsert(cur, r[3], "invoice_note", r[0], text, {
                        "invoice_number": r[2], "client_name": r[7],
                        "issue_date": str(r[4]), "status": r[5],
                        "total_amount": float(r[6]) if r[6] else None,
                    }, emb.tolist())
                logger.info("Auto-embedded %d new invoice notes.", len(rows))

            # --- New expenses ---
            cur.execute("""
                SELECT id, description, category, amount, date, user_email
                FROM   expenses
                WHERE  id NOT IN (
                    SELECT source_id FROM invoice_embeddings WHERE source_type = 'expense'
                )
            """)
            rows = cur.fetchall()
            if rows:
                model = _get_model()
                texts = [f"Expense ({r[2]}): {r[1]}, ₹{r[3]} on {r[4]}" for r in rows]
                for r, emb, text in zip(rows, list(model.embed(texts)), texts):
                    _upsert(cur, r[5], "expense", r[0], text, {
                        "category": r[2], "amount": float(r[3]), "date": str(r[4]),
                    }, emb.tolist())
                logger.info("Auto-embedded %d new expenses.", len(rows))

        conn.commit()
    except Exception as exc:
        logger.error("embed_incremental failed: %s", exc)
        conn.rollback()
    finally:
        conn.close()


def main():
    logger.info("Loading model '%s' (downloads ~80 MB on first run) ...", MODEL_NAME)
    _get_model()  # warm up

    conn = _conn()
    try:
        with conn.cursor() as cur:
            _setup(cur)
            _embed_invoice_items(cur, _get_model())
            _embed_invoice_notes(cur, _get_model())
            _embed_expenses(cur, _get_model())
        conn.commit()
        logger.info("All embeddings committed.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
