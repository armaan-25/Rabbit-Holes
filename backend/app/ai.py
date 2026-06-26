"""
The AI layer. Per the product brief, AI is used *only* for clustering tabs into
rabbit holes, naming investigations, and extracting entities — never as the
product itself. The product is the context graph.

Uses the Anthropic Messages API and asks for strict JSON in the shape the web app
consumes.
"""

import json
import os
import re
from collections import Counter
from urllib.parse import urlparse

from anthropic import Anthropic

from .schemas import RawEvent, ClusterResult, HoleContext, ChatTurn, Entity

DEFAULT_MODEL = os.environ.get("RABBIT_HOLE_MODEL", "claude-haiku-4-5")
CLUSTER_MODEL = os.environ.get("RABBIT_HOLE_CLUSTER_MODEL", DEFAULT_MODEL)
ASK_MODEL = os.environ.get("RABBIT_HOLE_ASK_MODEL", DEFAULT_MODEL)
BRIEF_MODEL = os.environ.get("RABBIT_HOLE_BRIEF_MODEL", DEFAULT_MODEL)

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
    for s in _dedupe_searches(searches):
        lines.append(f"- [{s.at}] {s.query}")
    lines.append("\nPAGES (id | domain | title):")
    for i, p in enumerate(pages):
        pid = f"p{i}"
        lines.append(f"- {pid} | {p.domain or ''} | {p.title or p.url}")
    return "\n".join(lines)


def _search_key(search: RawEvent) -> str:
    query = " ".join((search.query or search.url or "").lower().strip().split())
    engine = (search.engine or "").lower().strip()
    return f"{engine}:{query}"


def _dedupe_searches(searches: list[RawEvent]) -> list[RawEvent]:
    seen: set[str] = set()
    cleaned: list[RawEvent] = []
    for search in searches:
        key = _search_key(search)
        if not key or key in seen:
            continue
        seen.add(key)
        cleaned.append(search)
    return cleaned


def _domain_of(page: RawEvent) -> str:
    if page.domain:
        return page.domain.replace("www.", "")
    if page.url:
        try:
            return urlparse(page.url).netloc.replace("www.", "")
        except Exception:
            return ""
    return ""


def _words(value: str) -> list[str]:
    stop = {
        "the", "and", "for", "with", "from", "into", "your", "you", "are", "how", "what",
        "why", "when", "where", "this", "that", "about", "google", "search", "page",
        "home", "login", "official", "website", "www", "com", "org", "net",
    }
    return [w for w in re.findall(r"[a-zA-Z][a-zA-Z0-9+.-]{2,}", value.lower()) if w not in stop]


def _title_from_signals(pages: list[RawEvent], searches: list[RawEvent]) -> str:
    if searches:
        query = searches[-1].query or searches[-1].url or ""
        words = _words(query)
        if words:
            return " ".join(w.capitalize() for w in words[:3])

    text = " ".join((p.title or p.url or "") for p in pages)
    common = [word for word, _ in Counter(_words(text)).most_common(3)]
    if common:
        return " ".join(w.capitalize() for w in common[:3])

    domains = [_domain_of(p).split(".")[0] for p in pages if _domain_of(p)]
    if domains:
        return f"{domains[0].capitalize()} Research"
    return "Captured Research"


def _fallback_cluster(pages: list[RawEvent], searches: list[RawEvent]) -> list[ClusterResult]:
    if not pages:
        return []

    domains = [_domain_of(page) for page in pages if _domain_of(page)]
    domain_counts = Counter(domains)
    title = _title_from_signals(pages, searches)
    text = " ".join([*(s.query or "" for s in searches), *(p.title or p.url or "" for p in pages)])
    topics = [word for word, _ in Counter(_words(text)).most_common(5)] or ["research trail"]
    entities = [
        Entity(id=f"e{i}", name=domain, kind="tool" if "github" in domain else "concept", mentions=count)
        for i, (domain, count) in enumerate(domain_counts.most_common(8))
    ]

    if searches:
        description = f"Research around {searches[-1].query or title}, built from {len(pages)} captured pages."
        questions = [f"What did these pages establish about {searches[-1].query or title}?"]
    else:
        description = f"A page-driven investigation built from {len(pages)} captured pages."
        questions = [f"What connects these {len(pages)} captured pages?"]

    return [
        ClusterResult(
            title=title,
            description=description,
            topics=topics,
            questions=questions,
            entities=entities,
            page_ids=[f"p{i}" for i, _page in enumerate(pages)],
            confidence=0.64 if searches else 0.52,
        )
    ]


def _valid_holes(holes: list[ClusterResult], page_count: int) -> list[ClusterResult]:
    valid_page_ids = {f"p{i}" for i in range(page_count)}
    cleaned: list[ClusterResult] = []
    assigned: set[str] = set()
    for hole in holes:
        page_ids = [pid for pid in hole.page_ids if pid in valid_page_ids and pid not in assigned]
        if not page_ids:
            continue
        assigned.update(page_ids)
        hole.page_ids = page_ids
        cleaned.append(hole)
    return cleaned


def cluster(pages: list[RawEvent], searches: list[RawEvent]) -> list[ClusterResult]:
    """Cluster the captured signals into rabbit holes."""
    if not pages and not searches:
        return []

    try:
        client = Anthropic()  # reads ANTHROPIC_API_KEY from the environment
        response = client.messages.create(
            model=CLUSTER_MODEL,
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
        if isinstance(holes, list):
            cleaned = _valid_holes([ClusterResult(**h) for h in holes if isinstance(h, dict)], len(pages))
            if cleaned:
                return cleaned
    except Exception:
        pass

    return _fallback_cluster(pages, searches)


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
        model=ASK_MODEL,
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
        model=BRIEF_MODEL,
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
