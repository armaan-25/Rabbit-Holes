"""
The AI layer. Per the product brief, AI is used *only* for clustering tabs into
rabbit holes, naming investigations, and extracting entities — never as the
product itself. The product is the context graph.

Uses the Anthropic Messages API and asks for strict JSON in the shape the web app
consumes.
"""

import json
import os

from anthropic import Anthropic

from .schemas import RawEvent, ClusterResult, HoleContext, ChatTurn

MODEL = os.environ.get("RABBIT_HOLE_MODEL", "claude-opus-4-8")

# Structured-output schema. Constrains the response to a list of rabbit holes.
_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "holes": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "topics": {"type": "array", "items": {"type": "string"}},
                    "questions": {"type": "array", "items": {"type": "string"}},
                    "entities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "kind": {
                                    "type": "string",
                                    "enum": ["concept", "company", "person", "repo", "paper", "tool"],
                                },
                                "mentions": {"type": "integer"},
                            },
                            "required": ["id", "name", "kind", "mentions"],
                        },
                    },
                    "page_ids": {"type": "array", "items": {"type": "string"}},
                    "confidence": {"type": "number"},
                },
                "required": [
                    "title", "description", "topics", "questions",
                    "entities", "page_ids", "confidence",
                ],
            },
        }
    },
    "required": ["holes"],
}

_SYSTEM = (
    "You organize a person's raw browsing into 'rabbit holes' — coherent "
    "investigations defined by the question they were chasing, not by tab order. "
    "Group the pages and searches into 1-5 investigations. For each, write a short "
    "title (2-3 words, like 'AI Systems'), a one-sentence description of what they "
    "were trying to learn, the topics explored, the open questions implied by their "
    "path, and the key entities (concepts, companies, people, repos, papers, tools). "
    "Assign every page to exactly one hole via page_ids, and give a 0-1 confidence "
    "for the clustering. Be concise and concrete; do not invent pages they didn't visit. "
    "Return only valid JSON with no markdown, commentary, or code fences."
)


def _json_instructions() -> str:
    return (
        "Return only JSON. Do not include markdown or explanations. Use this exact shape:\n"
        '{"holes":[{"title":"Short Title","description":"One sentence.",'
        '"topics":["topic"],"questions":["question"],'
        '"entities":[{"id":"e0","name":"Entity","kind":"concept","mentions":1}],'
        '"page_ids":["p0"],"confidence":0.9}]}\n'
        "The value of holes must be an array of objects, not a schema."
    )


def _parse_json_object(text: str) -> dict:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            return {"holes": []}
        data = json.loads(text[start : end + 1])

    if isinstance(data, dict):
        return data
    return {"holes": []}


def _format_signals(pages: list[RawEvent], searches: list[RawEvent]) -> str:
    lines = ["SEARCHES:"]
    for s in searches:
        lines.append(f"- [{s.at}] {s.query}")
    lines.append("\nPAGES (id | domain | title):")
    for i, p in enumerate(pages):
        pid = f"p{i}"
        lines.append(f"- {pid} | {p.domain or ''} | {p.title or p.url}")
    return "\n".join(lines)


def cluster(pages: list[RawEvent], searches: list[RawEvent]) -> list[ClusterResult]:
    """Cluster the captured signals into rabbit holes."""
    if not pages and not searches:
        return []

    client = Anthropic()  # reads ANTHROPIC_API_KEY from the environment
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": _format_signals(pages, searches) + "\n\n" + _json_instructions(),
            }
        ],
    )

    text = "".join(b.text for b in response.content if b.type == "text")
    data = _parse_json_object(text)
    holes = data.get("holes", [])
    if not isinstance(holes, list):
        return []
    return [ClusterResult(**h) for h in holes if isinstance(h, dict)]


# ---------------------------------------------------------------------------
# Per-hole reasoning: ask (grounded Q&A) and synthesize (brief). These read a
# single rabbit hole's captured context and answer over it — the only place AI
# touches an individual investigation rather than the clustering layer.
# ---------------------------------------------------------------------------

def _format_hole(hole: HoleContext) -> str:
    lines = [f"INVESTIGATION: {hole.title}"]
    if hole.description:
        lines.append(hole.description)
    if hole.searches:
        lines.append("\nSEARCHES:")
        lines.extend(f"- {q}" for q in hole.searches)
    lines.append("\nPAGES (id | domain | title):")
    for p in hole.pages:
        lines.append(f"- {p.id} | {p.domain or ''} | {p.title}")
    return "\n".join(lines)


def _first_json(response) -> dict:
    text = "".join(b.text for b in response.content if b.type == "text")
    return _parse_json_object(text)


_ASK_SYSTEM = (
    "You answer questions about ONE of the user's browsing investigations, using only "
    "the pages and searches captured in it. Ground every claim in those sources and cite "
    "them inline by page id in square brackets, e.g. [p3]. If the captured pages don't "
    "contain the answer, say so plainly rather than guessing — you may note what they'd "
    "need to look at next. Be concise and concrete."
)

_ASK_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "answer": {"type": "string"},
        "citations": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["answer", "citations"],
}


def ask(hole: HoleContext, question: str, history: list[ChatTurn]) -> dict:
    """Answer a question grounded in one rabbit hole's captured pages."""
    client = Anthropic()
    messages = [{"role": "user", "content": _format_hole(hole)}]
    for turn in history[-8:]:
        role = "assistant" if turn.role == "assistant" else "user"
        messages.append({"role": role, "content": turn.content})
    messages.append({
        "role": "user",
        "content": (
            question
            + "\n\nReturn only JSON with this exact shape: "
            '{"answer":"grounded answer with [p0] citations","citations":["p0"]}'
        ),
    })

    response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=_ASK_SYSTEM,
        messages=messages,
    )
    data = _first_json(response)
    return {
        "answer": data.get("answer", ""),
        "citations": [c for c in data.get("citations", []) if isinstance(c, str)],
    }


_SYNTH_SYSTEM = (
    "You write a tight research brief from ONE of the user's browsing investigations — "
    "the deliverable they never got around to making. Work only from the captured pages "
    "and searches. Produce: a 2-3 sentence summary of what they were figuring out and "
    "where they landed; a comparison of the main options/approaches/entities they weighed "
    "(empty if the investigation isn't comparative); contradictions or open tensions across "
    "sources; the open questions their path implies; and concrete next steps. Be specific and "
    "honest about what the sources do and don't establish."
)

_SYNTH_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "comparison": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "points": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "points"],
            },
        },
        "contradictions": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}},
        "next_steps": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summary", "comparison", "contradictions", "open_questions", "next_steps"],
}


def synthesize(hole: HoleContext) -> dict:
    """Produce a structured research brief for one rabbit hole."""
    client = Anthropic()
    response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=_SYNTH_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    _format_hole(hole)
                    + "\n\nReturn only JSON with this exact shape and no markdown: "
                    '{"summary":"2-3 sentence summary","comparison":[{"title":"Option","points":["point"]}],'
                    '"contradictions":["tension"],"open_questions":["question"],"next_steps":["step"]}'
                ),
            }
        ],
    )
    data = _first_json(response)
    return {
        "summary": data.get("summary", ""),
        "comparison": data.get("comparison", []),
        "contradictions": data.get("contradictions", []),
        "open_questions": data.get("open_questions", []),
        "next_steps": data.get("next_steps", []),
    }
