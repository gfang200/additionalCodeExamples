openFile = open("cellRefs.txt","r")
lines= openFile.readlines()
newLines=[]


for i in lines:
    i=i.strip("\n")
    
    if i[1]=="*":
        page=i[2:]

    else:
        position = i.find("~")
        cell = i[:position]
        content = i[position+1:]

        correctedLine = "'%s'~%s~%s\n" % (page, cell, content)
        newLines.append(correctedLine)

newCode = open("code.txt","w")
newCode.writelines(newLines)
newCode.close()



    
        
        
