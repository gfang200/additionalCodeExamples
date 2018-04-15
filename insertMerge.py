array = [[1,3],[5,7],[9,13],[10,12],[17,22],[25,30]]
merge = [10,16]

#First find where it makes sense to insert the new value into the array, if we keep it somewhat sorted, we can optimize on that fact later on
def insert(array, merge):
    for i in range(len(array)-1):
        if (array[i][1] >= merge[0]) and (array[i+1][0] >= merge[1]):
            final = array[0:i]+[merge]+array[i:]
            return final
        
    #edge case, if the inserted value is bigger than everything, just insert it at the end
    final=array+[merge]
    return final

#ok now we only have 1 array that we need to condense
output = insert(array, merge)

#starting set
print output


#the condense function is designed to pass through the array, and merge any 2 overlapping values
def condense(array):
    #helper function to determine if there's overlap between 2 arrays
    #ASSUMPTION that all arrays are well formed [lower, higher]
    def check_overlap(a1,a2):
        if (a1[0]<=a2[1] and a2[0]<=a1[1] and a1 != a2):
            return True
        else:
            return False

    #merge function to combine 2 overlapping values into 1, it takes the lower value of the first array and the higher value of the second
    #ASSUMPTION that the left array will always be lower than the right array (because it's sorted, and insert places it in the right place)
    def merge(a1, a2):

        #edge case, when the second array falls within the first array, the second array is consumed
        if a2[1]<= a1[1] and a2[0] >= a1[0]:
            return a1
        #otherwise, return the smallest and the largest as merge
        nums = a1+a2

        return [min(nums), max(nums)]

    #helper variables
    new_list = []
    skip_next = False
    
    for i in range(len(array)):

        #ok so this is pretty troll, I'm not 100% on the best way to remove an array value in place after merging, so I just built a catch
        #here to skip whenever I run merge, so that the second value of the merge is merged into the first value
        
        if skip_next:
            skip_next = False
            continue


        #edge case, just append the last value since it's not merging with anything after it
        if i == len(array)-1:
            new_list.append(array[i])

        #If I detect overlap, then merge the the array at i with the array at i+1
        #ASSUMPTION I think the arrays might have to be sorted for this to work
        #but it's definitely the case that the more sorted the arrays are, the faster the runtime will be
        elif check_overlap(array[i],array[i+1]):
            merged = merge(array[i],array[i+1])
            new_list.append(merged)
            skip_next = True

        #otherwise, no modification is needed and I just add the array to the list
        else:
            new_list.append(array[i])

    #print new_list
    return new_list

last_time = ""
#So I can for sure optimize this significantly more if I could modify in place, but it's guaranteed to be less iterations than the number of items in the output
#because when n = the number of items, they'll be one item in the list

for i in range(0, len(output)):
    #defenitely sub optimal solution, but i keep running condense until everything that needs to be merged is merged
    output = condense(output)

    #Fake optimization attempt, if there are no more changes, then there will be no more future changes either, so just break the loop here
    if output == last_time:
        break
    
    last_time = output[:] #copy by val
    

print output
