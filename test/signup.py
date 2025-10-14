# signup.py
import re

class UserDatabase:
    def __init__(self):
        self.users = {}  # store users as {email: password}

    def register_user(self, email, password):
        if not email or not password:
            raise ValueError("Email and password are required.")
        if not self._is_valid_email(email):
            raise ValueError("Invalid email format.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if email in self.users:
            raise ValueError("User already exists.")
        self.users[email] = password
        return True

    def _is_valid_email(self, email):
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return re.match(pattern, email) is not None
