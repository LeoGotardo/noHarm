from dataclasses import dataclass

@dataclass
class Chat:
    id: str
    sender: str
    reciver: str
    _started_at: str
    _ended_at: str
    status: int
    messages: list
    _created_at: str
    _updated_at: str