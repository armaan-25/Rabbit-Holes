from typing import Literal, Optional
from pydantic import BaseModel

# --- Raw events shipped by the Chrome extension ----------------------------

class RawEvent(BaseModel):
    type: str  # visit | search | title | tab_open | tab_close
    at: str
    sessionId: str
    tabId: Optional[int] = None
    url: Optional[str] = None
    domain: Optional[str] = None
    title: Optional[str] = None
    query: Optional[str] = None
    engine: Optional[str] = None
    referrer: Optional[str] = None
    transition: Optional[str] = None


class EventBatch(BaseModel):
    sessionId: str
    events: list[RawEvent]


class SessionCreateResponse(BaseModel):
    session_id: str


class ClearRequest(BaseModel):
    sessionId: Optional[str] = None


# --- Clustered output (mirrors web/lib/types.ts) ---------------------------

class Entity(BaseModel):
    id: str
    name: str
    kind: Literal["concept", "company", "person", "repo", "paper", "tool"]
    mentions: int


class ClusterResult(BaseModel):
    """What the AI layer returns for one detected rabbit hole."""
    title: str
    description: str
    topics: list[str]
    questions: list[str]
    entities: list[Entity]
    page_ids: list[str]  # ids of pages assigned to this hole
    confidence: float


# --- Per-hole AI requests (ask + synthesize) -------------------------------

class HolePage(BaseModel):
    id: str
    title: str
    domain: Optional[str] = None
    url: Optional[str] = None
    kind: Optional[str] = None


class HoleContext(BaseModel):
    """A single rabbit hole's captured context, sent by the web app."""
    title: str
    description: str = ""
    searches: list[str] = []
    pages: list[HolePage] = []
    topics: list[str] = []
    questions: list[str] = []


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AskRequest(BaseModel):
    hole: HoleContext
    question: str
    history: list[ChatTurn] = []


class SynthesizeRequest(BaseModel):
    hole: HoleContext
