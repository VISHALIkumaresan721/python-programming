n = int(input("Enter amount: "))

count = 0

while n > 0:
    if n % 2 == 1:
        count += 1
    n = n // 2

print("Minimum coins required:", count)
