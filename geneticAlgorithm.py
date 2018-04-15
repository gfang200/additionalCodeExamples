#Genetic Algorithm 1
#Hello World
#George Fang
import random
import operator

word=raw_input("what is the word? ")
answer=word.lower()
letters=[]
allletters=[" ","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]

for i in answer:
    letters.append(i)

#fitness function to determine how good a solution is based on a pre-defined optimal state    
def fitness(string):
    global answer
    fit=0
    for i in range(len(string)):
            if string[i-1]==answer[i-1]:
                fit+=20
            else:
                continue
    for i in string:
        if i in letters:
            fit+=.5
    return fit

#start with a random population of x size
def randompop(x):
    global answer
    population=[]
    for i in range(x):
        randoms=""
        for j in range(len(answer)):
            randoms=randoms+random.choice(allletters)
        population.append(randoms)
    return population

#helper function to determine the fitness of the current generation
def findfitness(population):
    popfit={}
    for i in population:
        popfit[i]=fitness(i)
    return popfit

#rankfit algorithm to identify which solutions are the strongest in the set
def rankfit(popfit):
    total=0
    for i in popfit:
        total=total+popfit[i]
    for i in popfit:
        popfit[i]=(popfit[i]/total)
    return popfit

#random roullette sampling algorithm to choose strong candidates to 'breed'
def weightedpick(d):
    r = random.uniform(0,sum(d.itervalues()))
    s=0.0
    for k, w in d.iteritems():
        s+=w
        if r<s:
            return k
    return k

#genetic crossover function with a small chance of random mutation to maintain solution diversity
def crossover(x,y):
    w1=[]
    w2=[]
    w3=[]
    for i in x:
        w1.append(i)
    for i in y:
        w2.append(i)
    for i in range(len(x)):
        x=random.randrange(0,1000)
        if x<995:
            y=random.uniform(0,100)
            if y>50:
                w3.append(w1[i])
            else:
                w3.append(w2[i])
        else:
            w3.append(random.choice(allletters))
    final="".join(w3)
    return final

#main function
def evolve(population, children, iterations):
    global answer
    trials=0
    bestvalue=0
    reach=False
    while iterations!=0:
        rankpopulation=rankfit(population)
        newpop=[]
        for i in range(0,children):
            c1=weightedpick(population)
            c2=weightedpick(population)
            trys=population[c1]-population[c2]
##            if trys>0:
##                z=80
##            else:
##                z=20
            x=crossover(c1,c2)
            if population[c1]>x:
                newpop.append[c1]
            else:
                newpop.append(x)
        print findfitness(newpop)
##        print newpop
        population=findfitness(newpop)
        iterations-=1
        trials+=1
##        best=max(population.iteritems(), key=operator.itemgetter(1))[0]
##        if population[best]>bestvalue:
##            bestvalue=population[best]
##            bestname=best
##    print "\n\nwas your word", best
        
        
        for i in population:
            if i==answer:
                print "answer reached in %s trials" % trials
                iterations=0
                reach=True
    if reach==False:
        print "final answer not reached, highest value fitness is", max(population.iteritems(), key=operator.itemgetter(1))[0]
##        y=rankfit(findfitness(x))
##        evolve(y, children, iterations-1)
##    for i in population:
##        print i




z=findfitness(randompop(70))
print "original sample\n\n", z, "\n\npress enter to evolve..."
raw_input()
evolve(z,70,1000)
    
