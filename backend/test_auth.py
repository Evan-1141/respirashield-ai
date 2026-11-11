"""Unit tests for password hashing and session tokens (no server needed)."""

import os
import unittest

os.environ.setdefault('AUTH_SECRET', 'test-secret-only-for-unit-tests')
import auth  # noqa: E402


class AuthTests(unittest.TestCase):
    def test_password_roundtrip(self):
        stored = auth.hash_password('rahasia-123')
        self.assertNotIn('rahasia-123', stored)
        self.assertTrue(auth.verify_password('rahasia-123', stored))
        self.assertFalse(auth.verify_password('rahasia-124', stored))
        self.assertFalse(auth.verify_password('rahasia-123', None))

    def test_same_password_gets_different_salt(self):
        self.assertNotEqual(auth.hash_password('abc12345'), auth.hash_password('abc12345'))

    def test_token_roundtrip(self):
        self.assertEqual(auth.read_token(auth.create_token('user-1')), 'user-1')

    def test_tampered_token_rejected(self):
        body, sig = auth.create_token('user-1').split('.')
        forged_body = auth._b64(b'{"sub": "user-2", "exp": 9999999999}')
        self.assertIsNone(auth.read_token(f'{forged_body}.{sig}'))
        self.assertIsNone(auth.read_token('garbage'))
        self.assertIsNone(auth.read_token('a.b.c'))

    def test_expired_token_rejected(self):
        token = auth.create_token('user-1', now=1000)
        self.assertIsNone(auth.read_token(token, now=1000 + auth.TOKEN_TTL_SECONDS + 1))
        self.assertEqual(auth.read_token(token, now=1000 + auth.TOKEN_TTL_SECONDS - 1), 'user-1')


if __name__ == '__main__':
    unittest.main()
