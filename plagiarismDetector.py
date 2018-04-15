#George Fang
#For I-211
import os

def getNGrams(wordlist, n):
    return [wordlist[i:i+n] for i in range(len(wordlist)-(n-1))]

def compareStudents(student1, student2):
    alarm = False
    for key in student1.grams.keys():
        for gram in student1.grams[key]:
            for key2 in student2.grams.keys():
                for gram2 in student2.grams[key2]:
                    if gram == gram2:
                        alarm = True
    return alarm

class Student():
    def __init__(self, firstName, middleName, lastName, userName):
        self.homeDirectory = os.getcwd()
        self.firstName = firstName
        self.lastName = lastName
        self.userName= userName
        self.rawAssignments = {}
        self.assignments = {}
        self.grams = {}
##        self.assignmentName = []
##        self.assignmentText = []

    def getAssignment(self):
        def hasInfo(inputString):
            return any(char.isdigit() for char in inputString) or any(char.isalpha() for char in inputString)
        for student in os.listdir(os.getcwd()):
            if self.userName in student:
                os.chdir(student)
                directory=os.listdir(os.getcwd())
                os.chdir(directory[len(directory)-1])
                files=os.listdir(os.getcwd())
                for item in files:
                    if ".py" in item:
                        self.rawAssignments[item]=open(item, "r").read()
                        self.assignments[item]=[line for line in open(item, "r").read().split("\n") if hasInfo(line)]
        os.chdir(self.homeDirectory)

    def populateGrams(self, sensitivity):
        for key in self.assignments.keys():
            self.grams[key] = getNGrams(self.assignments[key], sensitivity)


class UnionFind:
    def __init__(self):
        """Create a new empty union-find structure."""
        self.weights = {}
        self.parents = {}

    def __getitem__(self, object):
        """Find and return the name of the set containing the object."""

        # check for previously unknown object
        if object not in self.parents:
            self.parents[object] = object
            self.weights[object] = 1
            return object

        # find path of objects leading to the root
        path = [object]
        root = self.parents[object]
        while root != path[-1]:
            path.append(root)
            root = self.parents[root]

        # compress the path and return
        for ancestor in path:
            self.parents[ancestor] = root
        return root
        
    def __iter__(self):
        """Iterate through all items ever found or unioned by this structure."""
        return iter(self.parents)

    def union(self, *objects):
        """Find the sets containing the objects and merge them all."""
        roots = [self[x] for x in objects]
        heaviest = max([(self.weights[r],r) for r in roots])[1]
        for r in roots:
            if r != heaviest:
                self.weights[heaviest] += self.weights[r]
                self.parents[r] = heaviest
    


def setUp(sensitivity):
    students = []
    for student in os.listdir(os.getcwd()):
        if os.path.isdir(student):
            lastName = student.split(",")[0]
            firstName = student.split(",")[1].split("(")[0].strip()
            if " " in firstName:
                middleName = firstName.split(" ")[1]
                firstName = firstName.split(" ")[0]
            else:
                middleName = None
            userName = student.split("(")[1][:-1]
##            print firstName,middleName, lastName, userName
            students.append(Student(firstName, middleName, lastName, userName))
    for student in students:
        student.getAssignment()
        student.populateGrams(sensitivity)
    return students
##def hasInfo(inputString):
##    return any(char.isdigit() for char in inputString) or any(char.isalpha() for char in inputString)
##
##print hasInfo("     ")
##print hasInfo("x  ")
##print hasInfo("3")
##print hasInfo("")
##print hasInfo("x3  ")
def output_cheats(students):
    for i in range(len(students)):
        home = os.getcwd()
        try:
            os.mkdir(str(i))
        except:
            pass
        os.chdir(str(i))
        for student in students[i]:
            for key in student.rawAssignments.keys():
                newFile = open(student.userName+"_"+key, "w")
                newFile.write(student.rawAssignments[key])
                newFile.close()
        os.chdir(home)
            
    
def main():
    students = setUp(6)
    newSet = UnionFind()
    ##for student in students:
    ##    newSet[student]
    for student in students:
        for student2 in students:
            if compareStudents(student, student2) and student != student2:
##                print student.userName, student2.userName
                newSet.union(newSet[student],newSet[student2])
    groups = []
    finalGroups = []
    for student in newSet.parents.keys():
        groups.append( (student, newSet.parents[student]) )
    for group in groups:
        if group[0]==group[1]:
            kingpin = [group[0]]
            for group2 in groups:
                if group2[0]!=group2[1] and group[0] in group2:
                    kingpin.append(group2[0])
            finalGroups.append(kingpin)

    output_cheats(finalGroups)
    return students 
            

students = main()

##home=os.getcwd()
##directory = os.listdir(os.getcwd())
##allFiles=[]
##averageLength=0
##numberOfFiles=0
##for file in directory:
##    guy= file
##    if ".py" not in file and ".txt" not in file and ".csv" not in file:
##        os.chdir(file)
##        directory=os.listdir(os.getcwd())
##        os.chdir(directory[len(directory)-1])
##        files=os.listdir(os.getcwd())
##        print files
##        for item in files:
##            if ".py" in item:
##                thing=open(item, "r")
##                proje=thing.read()
##                words = proje.split("\n")
##                while True:
##                    try:
##                        words.remove("")
##                    except:
##                        break
##                averageLength+=len(words)
##                numberOfFiles+=1
##                words.append(item)
##                allFiles.append(words)
##                thing.close()
##        os.chdir(home)
##
##
##averageLength=averageLength/numberOfFiles
##print averageLength
##x = getNGrams(allFiles[0], 5)
##hwGrams = []
#####CHANGE THE SENSITIVITY NUMBER DEPENDING ON HOW SENSITIVE YOU WANT IT TO BE
##sensitivity = int(averageLength*.75)
###sensitivity = 10
##for homework in allFiles:
##    hwGrams.append(getNGrams(homework, sensitivity))
##cheaters=[]    
##
##
##
##for homework in hwGrams:
##    for gram in homework:
##        for homework2 in hwGrams:
##            for gram2 in homework2:
##                if gram==gram2 and homework[len(homework)-1][len(homework[len(homework)-1])-1]!=homework2[len(homework2)-1][len(homework2[len(homework2)-1])-1]:
##                    cheater = (homework[len(homework)-1][len(homework[len(homework)-1])-1], homework2[len(homework2)-1][len(homework2[len(homework2)-1])-1])
##                    if cheater not in cheaters and (cheater[1],cheater[0]) not in cheaters:
##                        cheaters.append(cheater)
##
##
##for cheater in cheaters:
##    print cheater
##
##newFile = open("groups.txt", "w")
##for cheater in cheaters:
##    newFile.write("Look at " + cheater[0] +" and " + cheater[1])
##    newFile.write("\n")
##newFile.close()
##
##
####To Do:
####Replace all variable names to test for refactoring
####add statistics tools
