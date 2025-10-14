# test_signup.py
import unittest
from signup import UserDatabase

class TestUserRegistration(unittest.TestCase):
    def setUp(self):
        self.db = UserDatabase()

    def test_successful_registration(self):
        result = self.db.register_user("test@example.com", "secure123")
        self.assertTrue(result)
        self.assertIn("test@example.com", self.db.users)

    def test_duplicate_registration(self):
        self.db.register_user("user@example.com", "password123")
        with self.assertRaises(ValueError) as context:
            self.db.register_user("user@example.com", "newpass123")
        self.assertEqual(str(context.exception), "User already exists.")

    def test_invalid_email(self):
        with self.assertRaises(ValueError):
            self.db.register_user("invalidemail", "password123")

    def test_short_password(self):
        with self.assertRaises(ValueError):
            self.db.register_user("valid@email.com", "123")

if __name__ == '__main__':
    unittest.main()
