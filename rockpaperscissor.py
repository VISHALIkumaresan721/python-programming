import random

user = input("Enter rock, paper or scissors: ")
computer = random.choice(["rock", "paper", "scissors"])

print("Computer:", computer)

if user == computer:
    print("Tie")
elif user == "rock" and computer == "scissors":
    print("You win")
elif user == "paper" and computer == "rock":
    print("You win")
elif user == "scissors" and computer == "paper":
    print("You win")
else:
    print("You lose")
