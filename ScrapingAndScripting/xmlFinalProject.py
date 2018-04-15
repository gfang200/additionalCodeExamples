import urllib
import re
import sys
import os
import shutil

class increment(object):
    
    def __init__(self):
        self.count=0

    def counter(self):
        self.count+=1
        return self.count

    def reset(self):
        self.count=0

def fixFindAll(word):
    return word[1:-1]

def htmlFindAll(line):
    #does not work
    print re.findall(">[/w]+<",line)
    #return [fixFindAll(thing) for thing in re.findall(">[A-Za-z'?!.&- ]+<",line)[:-1]]

def convertToURL(name):
    return "".join([word+"+" for word in name.split()])[:len(name)]
            
def connectToPage(url):
    con=urllib.urlopen(url)
    text=con.readlines()
    con.close()
    return text

def retrieveReleasesPage(album, artist):
    homePage = "http://musicbrainz.org/search?query=%s&type=artist&method=indexed" % convertToURL(artist)
    homeContent=connectToPage(homePage)
    for i in range(len(homeContent)):        
        if "<bdi>" in homeContent[i]:
            artistPage = homeContent[i].split('"')[1]
            break
    artistContent = connectToPage(artistPage)
    for i in range(len(artistContent)):        
        if "<bdi>"+album.lower() in artistContent[i].lower():
            albumPage = artistContent[i].split('"')[1]
            break
    albumReleases = connectToPage(albumPage)
    return albumReleases

def extractReleasesHelper(album, artist):
    ##TODO fix try and except loop here
    try:
        page = retrieveReleasesPage(album, artist)
        return extractAlbumReleases(page, album)
    except:
        return "None"

def extractAlbumReleases(text, album):
    albumList=[]
    firstTimePatch=True
    information=[]
    incrementer = increment()
    for i in range(len(text)):
        incrementer.reset()
        try:
            if '<bdi>'+album.lower() in text[i].lower():            
                if firstTimePatch:
                    firstTimePatch=False
                    continue
                #TODO extract comment
                formats = text[i+incrementer.counter()].split(">")[1][:-4]
##                print formats
                tracks = text[i+incrementer.counter()].split(">")[1][:-4]
##                print tracks
                dates = [item.strip("<li>") for item in re.findall("<li>[0-9-]+",text[i+incrementer.counter()])]
                country = []
                j=4
                while "/td" not in text[i+j]:
                    if re.findall('title="[A-Za-z ]+',text[i+j]):
                        country.append([item.strip('title="') for item in re.findall('title="[A-Za-z ]+',text[i+j])][0])
                    j+=1
                incrementer.count +=j-3
                label = "None"
                if "<td></td>" not in text[i+incrementer.counter()].split("<bdi>")[0]:
                    label = text[i+incrementer.count].split("<bdi>")[1].split("</bdi>")[0]
                try:
                    catalog = text[i+incrementer.counter()].split(">")[2].split("<")[0].strip()
                except:
                    catalog = ""
                try:
                    barcode = text[i+incrementer.counter()].split(">")[1].split("<")[0].strip()
                except:
                    barcode=""
                #print formats, tracks, dates, country, label, catalog, barcode

                albumList.append((formats,tracks,dates,country,label,catalog,barcode))
        except:
            continue
##    print albumList
    return albumList
    

def extractBandMembers(text):
    members=[]
    for i in range(len(text)):        
        if "musicGroupMember" in text[i]:
            members.append(text[i-2].strip()[7:len(text[i-2].strip())-1])
    return members

def extractActiveDate(text):
    for i in range(len(text)):        
        if "Active" in text[i]:
            num1 = text[i+1].strip()[5:9]
            num2 = text[i+1].strip()[13:17]
            if not num2.isdigit():
                num2="Current"
            return num1,num2

def extractOrigin(text):
    for i in range(len(text)):        
        if "Born" in text[i] or "Formed" in text[i]:
            return text[i+2].strip().split("in ")[1].split("<")[0].strip()

def extractSongInformation(text):
    songList=[]
    information=[]
    songNumber=1
    for i in range(len(text)):        
        if 'tr class="track' in text[i]:
            information=[songNumber,text[i+18].strip().split(">")[1][:-3]]
            songNumber+=1
        if 'div class="composer"' in text[i]:
            information.append([fixFindAll(composer) for composer in re.findall(">[A-Za-z ]+<",text[i+1])[:-1]])
        if 'td class="time' in text[i]:
            information.append(text[i+1].strip()[:4])
        if len(information)==4:
            songList.append(information)
            information=[]
    return songList

def extractArtist(album):
    #returns artist name
    text=connectToPage(extractAlbumURL(album))
    for i in range(len(text)):        
        if "album-artist" in text[i]:
            return text[i+5].split("<")[1].split(">")[1]
    

def extractArtistInformation(text):
    return [extractBandMembers(text),extractActiveDate(text), extractOrigin(text)]

def extractBandURL(bandName):
    con=urllib.urlopen("http://www.allmusic.com/search/artists/"+convertToURL(bandName))
    text=con.readlines()
    con.close()
    for i in range(len(text)):        
        if bandName.lower()+"</a>" in text[i].lower():
            return text[i].strip().split('"')[1]

def extractAlbumURL(albumName, caseOverride=False):
    con=urllib.urlopen("http://www.allmusic.com/search/albums/"+convertToURL(albumName))
    text=con.readlines()
    con.close()
    for i in range(len(text)):
        if not caseOverride:
            if albumName.lower()+"</a>" in text[i].lower():
                return text[i].strip().split('"')[1]
        else:
            if albumName.lower()+"</a>" in text[i].lower():
                return text[i].strip().split('"')[1]
            
def extractImageURL(album,artist):
    url="http://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords="+convertToURL(artist+" "+album+" Album Cover")+"&rh=i%3Aaps%2Ck%3A"+convertToURL(artist+" "+album+" Album Cover")
    con=urllib.urlopen(url)
    text=con.readlines()
    con.close()
    for i in range(len(text)):        
        #if "Product Details" in text[i] and album.lower() in text[i].lower():
        if "Product Details" in text[i]:
            return text[i].split("img alt")[1][19:].split('"')[1]

def imageHandler(album, artist):
    imageURL=extractImageURL(album, artist)
    if not os.path.exists("images"):
        os.mkdir("images")
    path="images//"+album+imageURL[-4:]
    urllib.urlretrieve(imageURL, path)
    return path
        
def quickGetInfo(album, artist=None):
    ##TODO ADD OPTIONAL ARTIST LOOKUP
    artist= extractArtist(album)
    songInformation = extractSongInformation(connectToPage(extractAlbumURL(album)))
    artistInformation = extractArtistInformation(connectToPage(extractBandURL(artist)))
    recordInformation = extractReleasesHelper(album, artist)
    return album, artist, songInformation, artistInformation, recordInformation

def lineXML(tag, data, spaces=0):
    if not data:
        data=""
    return "\t"*spaces+"<"+tag+">"+data+"</"+tag+">"

def setUpXML(info):
    file1 = open("albums.xml","a")
    albumName = info[0]
    artistName = info[1]
    songs = info[2]
    artist = info[3]
    record = info[4]

    file1.write("<album>"+"\n")
    file1.write(lineXML("albumName",albumName,1)+"\n")
    file1.write("\t<artist>"+"\n")
    file1.write(lineXML("artistName",artistName,1)+"\n")
    file1.write("\t\t<groupMembers>"+"\n")
    for member in artist[0]:
        file1.write(lineXML("member",member,3)+"\n")
    file1.write("\t\t</groupMembers>"+"\n")
    file1.write(lineXML("origin",artist[2],2)+"\n")
    file1.write(lineXML("career",artist[1][0]+"-"+artist[1][1],2)+"\n")
    file1.write("\t</artist>"+"\n")
    file1.write("\t<songs>"+"\n")
    for song in songs:
        file1.write("\t\t<song>"+"\n")
        file1.write(lineXML("position",str(song[0]),3)+"\n")
        file1.write(lineXML("title",song[1],3)+"\n")
        file1.write("\t\t\t<composers>"+"\n")
        for composer in song[2]:
            file1.write(lineXML("composer", composer, 4)+"\n")
        file1.write("\t\t\t</composers>"+"\n")
        file1.write(lineXML("length",song[3],3)+"\n")
        file1.write("\t\t<\song>"+"\n")
    file1.write("\t</songs>"+"\n")
    file1.write("\t<albumReleases>"+"\n")
    
    for release in record:
        try:
            for i in range(len(release[2])):
                file1.write( "\t\t<release>"+"\n")
                file1.write( lineXML("date", release[2][i],3)+"\n")
                try:
                    file1.write( lineXML("country",release[3][i],3)+"\n")
                except:
                    file1.write( lineXML("country","worldwide",3)+"\n")
                ###TODO temporary patch until I can figure out how to escape in regular expressions
                file1.write( lineXML("recordLabel",release[4],3)+"\n")
                file1.write( lineXML("tracks", release[1],3)+"\n")
                file1.write( lineXML("format", release[0],3)+"\n")
                file1.write( lineXML("catalogNumber", release[-2],3)+"\n")
                file1.write( lineXML("barCode", release[-1],3)+"\n")
                file1.write( "\t\t</release>"+"\n")
        except:
            continue
    file1.write( "\t</albumReleases>"+"\n")
    try:
        file1.write( lineXML("albumImage", imageHandler(albumName, artistName))+"\n")
    except:
        file1.write( lineXML("albumImage", "error")+"\n")
    file1.write( "</album>"+"\n")

    
    file1.close()
    
    
##con=urllib.urlopen("http://www.allmusic.com/search/artists/coldplay")
##page=con.readlines()
##con.close()
#print extractAlbumURL("Viva La Vida or Death and All His Friends")
##print extractSongInformation(connectToPage(extractAlbumURL("Neighborhoods")))
##print extractArtistInformation(connectToPage(extractBandURL("blink-182")))
#print quickGetInfo("X")
##extractReleasesHelper("X", "Ed Sheeran")
#print extractOrigin(connectToPage(extractBandURL("Jimi Hendrix")))
##print convertToURL("In The Lonely Hour")
##setUpXML(quickGetInfo("X"))
##print extractAlbumURL("In The Lonely Hour")
try:
    shutil.rmtree("images")
except:
    pass

file1 = open("albums.xml","w")
file1.write("<root>"+"\n")
file1.close()

while True:
    entry = raw_input("Enter an album name or STOP to stop: ")
##    setUpXML(quickGetInfo(entry))
    if entry=="STOP":
        break
    try:
        setUpXML(quickGetInfo(entry))
    except:
        print "Sorry! That album doesn't seem to work yet, here's some info", sys.exc_info()[0]
file1 = open("albums.xml","a")
file1.write("</root>")
file1.close()
