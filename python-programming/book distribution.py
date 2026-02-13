persons = ["P1", "P2", "P3"]
original_books = ["A", "B", "C"]
valid_distributions = []

def generate(arr, index):
    if index == len(arr):
        valid = True
        for i in range(len(arr)):
            if arr[i] == original_books[i]:  
                valid = False
                break
        
        if valid:
            distribution = {}
            for i in range(len(persons)):
                distribution[persons[i]] = arr[i]
            valid_distributions.append(distribution.copy())
        return

    for i in range(index, len(arr)):
        arr[index], arr[i] = arr[i], arr[index]
        generate(arr, index + 1)
        arr[index], arr[i] = arr[i], arr[index]

generate(original_books[:], 0)

for dist in valid_distributions:
    print(dist)

print("\nTotal valid distributions:", len(valid_distributions))

