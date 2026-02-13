triplets = []
for i in range(1, 73):
    for j in range(i, 73):
        for k in range(j, 73):
            if i * j * k == 72:
                triplets.append((i, j, k))
sum_dict = {}
for t in triplets:
    s = sum(t)
    if s not in sum_dict:
        sum_dict[s] = []
    sum_dict[s].append(t)
for s in sum_dict:
    if len(sum_dict[s]) > 1:
        possible = sum_dict[s]
for t in possible:
    if t.count(max(t)) == 1:
        print("Final Unique Answer:", t)
