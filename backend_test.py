#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Battleship Game
Tests all endpoints including admin, auth, and game functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class BattleshipAPITester:
    def __init__(self, base_url="https://naval-grid-wars.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.game_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data={"username": "admin_demo", "password": "Admin@123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_admin_user_management(self):
        """Test admin user management"""
        if not self.admin_token:
            self.log_test("Admin User Management", False, "No admin token")
            return False

        print("\n👥 Testing Admin User Management...")
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Create test user
        test_username = f"test_user_{int(time.time())}"
        success, response = self.run_test(
            "Create User",
            "POST",
            "admin/users",
            200,
            data={"username": test_username, "password": "TestPass123!", "avatar": 1},
            headers=headers
        )
        if success and 'id' in response:
            self.test_user_id = response['id']
            self.test_username = test_username
        
        # Get all users
        self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200,
            headers=headers
        )
        
        # Get all games (admin)
        self.run_test(
            "Get All Games (Admin)",
            "GET",
            "admin/games",
            200,
            headers=headers
        )
        
        return self.test_user_id is not None

    def test_user_login(self):
        """Test user login"""
        if not self.test_user_id:
            self.log_test("User Login", False, "No test user created")
            return False

        print("\n🔑 Testing User Authentication...")
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": self.test_username, "password": "TestPass123!"}
        )
        if success and 'token' in response:
            self.user_token = response['token']
            return True
        return False

    def test_game_creation(self):
        """Test game creation with ship placement"""
        if not self.user_token:
            self.log_test("Game Creation", False, "No user token")
            return False

        print("\n🚢 Testing Game Creation...")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Valid ship placement
        ships = [
            {"size": 4, "cells": [[0, 0], [0, 1], [0, 2], [0, 3]]},  # Horizontal 4-cell
            {"size": 3, "cells": [[2, 0], [2, 1], [2, 2]]},          # Horizontal 3-cell
            {"size": 2, "cells": [[4, 0], [4, 1]]}                   # Horizontal 2-cell
        ]
        
        success, response = self.run_test(
            "Create Game",
            "POST",
            "games",
            200,
            data={"ships": ships},
            headers=headers
        )
        if success and 'id' in response:
            self.game_id = response['id']
            return True
        return False

    def test_game_operations(self):
        """Test game-related operations"""
        if not self.user_token or not self.game_id:
            self.log_test("Game Operations", False, "Missing user token or game ID")
            return False

        print("\n🎮 Testing Game Operations...")
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Get games (lobby)
        self.run_test(
            "Get Available Games",
            "GET",
            "games",
            200,
            headers=headers
        )
        
        # Get my games
        self.run_test(
            "Get My Games",
            "GET",
            "games/my",
            200,
            headers=headers
        )
        
        # Get specific game
        self.run_test(
            "Get Game Details",
            "GET",
            f"games/{self.game_id}",
            200,
            headers=headers
        )
        
        # Get game board
        self.run_test(
            "Get Game Board",
            "GET",
            f"games/{self.game_id}/board",
            200,
            headers=headers
        )
        
        return True

    def test_invalid_operations(self):
        """Test invalid operations and error handling"""
        print("\n⚠️ Testing Error Handling...")
        
        # Invalid admin login
        self.run_test(
            "Invalid Admin Login",
            "POST",
            "auth/admin/login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )
        
        # Invalid user login
        self.run_test(
            "Invalid User Login",
            "POST",
            "auth/login",
            401,
            data={"username": "nonexistent", "password": "wrong"}
        )
        
        # Invalid ship placement
        if self.user_token:
            headers = {'Authorization': f'Bearer {self.user_token}'}
            invalid_ships = [
                {"size": 4, "cells": [[0, 0], [0, 1], [0, 2]]},  # Wrong size
            ]
            self.run_test(
                "Invalid Ship Placement",
                "POST",
                "games",
                400,
                data={"ships": invalid_ships},
                headers=headers
            )

    def test_cleanup(self):
        """Clean up test data"""
        if self.admin_token and self.test_user_id:
            print("\n🧹 Cleaning up test data...")
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            self.run_test(
                "Delete Test User",
                "DELETE",
                f"admin/users/{self.test_user_id}",
                200,
                headers=headers
            )

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Battleship API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test sequence
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
            
        if not self.test_admin_user_management():
            print("❌ Admin user management failed - stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ User login failed - stopping tests")
            return False
            
        self.test_game_creation()
        self.test_game_operations()
        self.test_invalid_operations()
        self.test_cleanup()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BattleshipAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())