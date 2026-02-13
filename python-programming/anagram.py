def generate_anagrams(word, current=""):
    
 
    if len(word) == 0:
        print(current)
        return
    
    
    for i in range(len(word)):
        remaining = word[:i] + word[i+1:]
        generate_anagrams(remaining, current + word[i])



word = input("Enter a word: ")

print("\nAnagrams are:")
generate_anagrams(word)
