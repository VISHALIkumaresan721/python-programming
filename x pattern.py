n="hello"
k=len(n)
for i in range(1, k+1):
    for j in range(1, k+1):
        if i==j or i+j==k+1:
            print(n[j-1], end=" ")
        else:
            print(" ", end=" ")
    print()