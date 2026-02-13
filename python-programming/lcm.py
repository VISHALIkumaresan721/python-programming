def gcd(a, b):
    
    while b:
        a, b = b, a % b
    return a


def lcm(a, b):
    
    return abs(a * b) // gcd(a, b)


def lcm_multiple(*numbers):
    if not numbers:
        raise ValueError("At least one number must be provided")
    
    result = numbers[0]
    for num in numbers[1:]:
        result = lcm(result, num)
    return result



if __name__ == "__main__":

    num1 = 12
    num2 = 18
    print(f"LCM of {num1} and {num2} is: {lcm(num1, num2)}")
    
    
    numbers = [4, 6, 8, 12]
    print(f"LCM of {numbers} is: {lcm_multiple(*numbers)}")
    
    print("\n--- User Input ---")
    a = int(input("Enter first number: "))
    b = int(input("Enter second number: "))
    print(f"LCM of {a} and {b} is: {lcm(a, b)}")
