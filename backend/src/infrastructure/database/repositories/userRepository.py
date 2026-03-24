from domain.entities.user import User

class UserRepository(User):
    def __init__(self, db):
        self.db = db