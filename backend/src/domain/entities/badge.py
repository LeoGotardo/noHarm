from dataclasses import dataclass

@dataclass
class Badge:
    id: str
    name: str
    description: str
    milestone: str
    icon: str
    status: int
    created_at: str
    updated_at: str