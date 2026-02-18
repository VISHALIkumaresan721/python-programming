def calculator():
    try:
        print("\n--- Calculator ---")
        print("1. Addition")
        print("2. Subtraction")
        print("3. Multiplication")
        print("4. Division")
        print("5. Modulus")
        print("6. Power")
        print("7. Floor Division")
        print("8. Exit")

        choice = int(input("Enter your choice (1-8): "))

        if choice == 8:
            print("Calculator closed.")
            return   # stop recursion

        num1 = float(input("Enter first number: "))
        num2 = float(input("Enter second number: "))

        if choice == 1:
            print("Result =", num1 + num2)

        elif choice == 2:
            print("Result =", num1 - num2)

        elif choice == 3:
            print("Result =", num1 * num2)

        elif choice == 4:
            try:
                if num2 != 0:
                    print(num1 / num2)
                else:
                    raise ZeroDivisionError
            except ZeroDivisionError:
                print("Cannot divide by zero")
                num1 = float(input("Enter first number: "))
                num2 = float(input("Enter second number: "))
                print(num1 / num2)

        elif choice == 5:
            try:
                if num2 != 0:
                    print(num1 % num2)
                else:
                    raise ZeroDivisionError
            except ZeroDivisionError:
                print("Cannot divide by zero")
                num1 = float(input("Enter first number: "))
                num2 = float(input("Enter second number: "))
                print(num1 % num2)

        elif choice == 6:
            print("Result =", num1 ** num2)

        elif choice == 7:
            print("Result =", num1 // num2)

        else:
            print("Invalid choice")

    except ValueError:
        print("Error: Please enter valid numbers")
    except ZeroDivisionError as e:
        print("Error:", e)
    except Exception as e:
        print("Unexpected error:", e)

    calculator()


calculator()
